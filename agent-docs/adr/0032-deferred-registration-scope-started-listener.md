# ADR-0032: Deferred registration scope boundaries are exposed as runtime listeners

## Status

proposed

## Context

Only routes and navigation items participate in a deferred registration run. An application that maintains its own registry, filled from the same deferred registration functions, has no way to join the run, and nothing in the framework tells it that a run is starting.

The case that surfaced it: a downstream application keeps a command palette registry — a flat, searchable list of navigation destinations — populated from the same deferred registration functions that register the navigation items. `ModuleManager.updateDeferredRegistrations` clears and replays the navigation items, so the sidebar is correct after a feature flag flips off. The palette is not cleared by anything, so its entries for that feature survive for the rest of the session. There is no correct place for that registry to reset itself.

`DeferredRegistrationsUpdateStartedEvent` already exists on the event bus, and a consumer can subscribe to it, but it is the wrong contract for this:

1. **Update path only.** It is dispatched by `useUpdateDeferredRegistrations`. The initial run, which goes through `ModuleManager.registerDeferredRegistrations`, dispatches no equivalent. A registry whose reset semantics differ between the first run and later runs has to know that, and a registry that must reset before the first run cannot.
2. **Dispatched by the React hook, not by the run.** The event sits around the call to `moduleManager.updateDeferredRegistrations`, not inside it. A run driven any other way is not bracketed by it, and its ordering relative to the navigation item replay is a property of the hook's statement order rather than of the scope.
3. **A bus subscription is not a lifecycle.** A plugin subscribing in its constructor has no stated release point, and the subscription is not visibly tied to the state it resets.

The run already has exact boundaries. `ModuleManager` brackets both paths with `runtime.startDeferredRegistrationScope()` and `runtime.completeDeferredRegistrationScope()`.

## Options Considered

1. **Optional lifecycle methods on `Plugin`** (`onDeferredRegistrationScopeStarted`) — Attractive because the state usually lives in a plugin and there is nothing to subscribe or release. But the run boundary is a runtime concern, not a plugin one, and a consumer holding per-run state outside a plugin — an application-side registration helper, for instance — needs the same signal.

2. **Fan out from `ReactRouterRuntime` only** — `ReactRouterRuntime` is the only concrete implementation of `startDeferredRegistrationScope`. Smallest possible change, but the listener API would live on a package below the one that owns the abstraction, and `Runtime` consumers could not type against it.

3. **`Runtime` grows a concrete method wrapping the abstract one** — Reads best: one declaration site, and every runtime gets the fan-out for free. But it requires renaming the abstract member (to `_startDeferredRegistrationScope` or similar), which is a breaking change for every external `Runtime` subclass, and therefore a major on `@squide/core` and `@squide/react-router`. Worse, `noImplicitOverride` is not enabled, so a subclass left with the old member name would silently shadow the new wrapper and kill the fan-out with no compile error — including the eight `Runtime` test doubles in this repository, which are exactly that shape.

4. **Hybrid: public API and storage on `Runtime`, firing in the concrete runtime** — `Runtime` owns the listener set, the public `register`/`remove` pair, and a `protected _notifyDeferredRegistrationScopeStarted(operation)` helper. `ReactRouterRuntime.startDeferredRegistrationScope` calls the helper.

## Decision

Option 4, the hybrid.

It buys everything option 3 wants — one declaration site, the API typed on `IRuntime`, `RuntimeScope` handled once, every runtime inheriting the API — with no rename, no test-double churn, and a minor version bump instead of a major. The cost is that a future concrete runtime must remember to call `_notifyDeferredRegistrationScopeStarted`; the project has had exactly one concrete runtime implementing scopes in its lifetime, and the helper is documented at its declaration.

Naming follows the existing listener APIs — `ModuleManager.registerModulesRegisteredListener` / `removeModulesRegisteredListener` and `ModuleRegistry.registerStatusChangedListener` / `removeStatusChangedListener`. Registration returns a disposer as well as offering an explicit remove, matching the newer `LocalModuleRegistry.registerStatusChangedListener`.

The payload reuses `DeferredRegistrationOperation` (`"register" | "update"`), already handed to every deferred registration function as its third argument, so a listener and a module see the same vocabulary from the same source. `ModuleManager` passes it explicitly through the new `operation` option on `StartDeferredRegistrationScopeOptions` rather than having the runtime derive it from `transactional`: `transactional` means "replay the navigation registry transactionally", which is a strategy, not a run identity, and they are 1:1 only because there happen to be exactly two run kinds today. `operation` is optional and falls back to `transactional ? "update" : "register"` so that direct callers keep working.

Supporting decisions:

- **Only the started listener ships in this change.** The completed listener described in the original proposal is deliberately deferred. A consumer holding a store read through `useSyncExternalStore` needs it and must buffer internally, and that buffering contract deserves its own design pass.
- **`RuntimeScope` delegates rather than throws.** ADR-0002 restricts `moduleManager`, `startDeferredRegistrationScope`, `completeDeferredRegistrationScope`, `startScope`, and `_validateRegistrations` because each lets a module *drive* the lifecycle or reach internals. Observing a boundary carries no such hazard, and `eventBus` — the existing observation channel — is already fully reachable from a scope instance.
- **A throwing listener is caught and logged, never propagated.** `startDeferredRegistrationScope` is called *before* the `try`/`finally` that completes the scope in both `ModuleManager` paths, so an escaping error would leave `_navigationItemScope` set and make every subsequent run for the lifetime of the runtime throw "Cannot start a new deferred registration scope when there's already an active scope". `ReactRouterRuntime.completeDeferredRegistrationScope` already declares that failure mode unacceptable.
- **Ordering is registration order**, and the listener set is copied before notifying so that a listener disposing of itself or of a sibling does not alter the notification in progress.
- **Started fires after the scope object is in place and before any deferred registration function runs**, so a listener can never block scope creation and always observes the pre-replay state.

## Consequences

- Applications and plugins can reset per-run state from a single signal that covers both the initial run and every update, without knowing which one they are in.
- The signal is a property of the run boundary rather than of the React hook that happens to drive it, so it holds for any run driven through `ModuleManager`.
- `@squide/core`, `@squide/react-router`, and `@squide/firefly` take a minor bump. Nothing existing breaks: the API is purely additive and `StartDeferredRegistrationScopeOptions.operation` is optional.
- `Runtime` now exposes a listener API that its own abstract implementation does not fire. A concrete runtime that forgets to call `_notifyDeferredRegistrationScopeStarted` gets a silently inert API — accepted, and mitigated by the comment at the helper's declaration.
- The event bus remains the channel for cross-module communication (ADR-0003). This does not supersede it; the scope listeners are a lifecycle extension point on the runtime, not a message channel between modules.
- ADR-0002's list of operations restricted on `RuntimeScope` is unchanged; this record clarifies that the restriction is about control, not observation.
