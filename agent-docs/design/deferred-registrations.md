# Deferred Registrations

## Overview

Squide uses a **two-phase registration** system that allows modules to conditionally register
routes and navigation items based on runtime data (user permissions, feature flags, etc.).

## How It Works

1. **Phase 1 (initial)** — the module's register function runs at bootstrap, registering
   routes and navigation items that are always present.

2. **Phase 2 (deferred)** — the register function returns a callback. This callback re-runs
   whenever global data or feature flags change, enabling conditional registrations.

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    // Phase 1: always registered
    runtime.registerRoute({ path: "/dashboard", element: <Dashboard /> });

    // Phase 2: deferred, re-runs when data/flags change
    return (runtime, data, operation) => {
        if (data.role === "admin") {
            runtime.registerNavigationItem({
                $id: "admin",
                $label: "Admin",
                to: "/admin"
            });
        }
    };
};
```

## Triggers for Re-execution

Deferred registrations automatically re-execute when:
- `usePublicDataQueries` or `useProtectedDataQueries` return new data
- LaunchDarkly feature flag values change (streaming mode)

## Registration Scopes

Every deferred registration run is bracketed by a **scope**, opened and closed by
`ModuleManager` around the modules:

- `runtime.startDeferredRegistrationScope({ transactional })` before the modules run
- `runtime.completeDeferredRegistrationScope()` after they settle, in a `finally`

`ReactRouterRuntime` uses the open scope to decide how to tag an incoming navigation item.
`registerNavigationItem` tags it `"deferred"` when a scope is active and `"static"` otherwise,
which is what lets a transactional scope clear only the deferred items of the previous run and
replay the new ones (`NavigationItemRegistry.clearDeferredItems`).

The initial run is **non-transactional** (write-through) and update runs are **transactional**
(buffer, then clear and replay on complete). The initial run cannot buffer:
`LocalModuleRegistry` flips its status to `"ready"` while the scope is still open, which
synchronously drives `modules-ready` / `ModulesReadyEvent`.

These runtime methods are framework-internal. They are exported from `@squide/core` but
deliberately absent from `docs/reference/runtime/FireflyRuntime.md` — consumers must not call
them.

### Plugin Hook

Consumer plugins own registries that modules fill from their deferred registration functions,
and those registries need the same clear-and-replay treatment. `Plugin` carries one optional
method for this:

```ts
onDeferredRegistrationScopeStarted?(options: DeferredRegistrationScopeOptions):
    DeferredRegistrationScopeCompletionFunction | void;
```

`ModuleManager.#withDeferredRegistrationScope` drives it: the hooks run as the first statement
inside the scope, and the returned completion functions run in the `finally`, **before**
`completeDeferredRegistrationScope()`.

Each hook and each completion function is individually try/caught and logged, and a failure never
propagates. Two reasons, both load-bearing — do not "simplify" this into a rethrow:

- Aborting the run would skip the module registries entirely, so `LocalModuleRegistry` would never
  reach `#setRegistrationStatus("ready")`. `isBootstrapping` requires `areModulesReady`, and
  `useDeferredRegistrations` doesn't catch the `register()` promise, so a single faulty plugin would
  pin the application on its bootstrapping fallback for the session with only an unhandled rejection
  to show for it.
- Throwing *after* a successful run would abort `useUpdateDeferredRegistrations` before it dispatches
  `deferred-registrations-updated`. `useNavigationItems` re-renders only off that dispatch, so the
  navigation items committed moments earlier would never appear.

This also matches how a faulty module is already treated: `Promise.allSettled` collects its error and
the registry still goes `"ready"`.

Ordering is load-bearing. The completion functions land before `useUpdateDeferredRegistrations`
resumes, therefore before `appRouterStore` subscribers are notified and before React re-renders.
The event bus cannot provide this: `useEnhancedReducerDispatch` notifies subscribers *before*
`DeferredRegistrationsUpdateCompletedEvent`, and the initial run has no event bracket at all.

Deliberate constraints. Ordering, both operations, plugin skipping, a throwing hook, a throwing
completion function and error precedence are covered by tests in
`packages/core/tests/ModuleManager.test.ts`; the first two below are contract, not enforced:

- The hook and the completion function are synchronous. Nothing awaits them — required by the
  Honeycomb active-span constraint documented in `ModuleManager.updateDeferredRegistrations`.
  **Do not make these async.**
- On an update run, a completion function must not read the navigation registry: that run's items
  are not committed yet. (On the initial run it would read that run's items, because the
  non-transactional scope writes through, but the contract is uniform — "commit your own registry,
  nothing else".)
- Completion functions run even when the run fails, with whatever was buffered. Partial commit,
  no rollback — same semantics as Squide's own navigation scope.
- A plugin error is logged and never propagates, for the two reasons above.

The hook lives on the `Plugin` class rather than on a separate interface: everything it needs
is in `@squide/core`, so the call site needs no cast, unlike `FireflyPlugin`, which must be an
interface because its types live in `@squide/firefly`.

### Runtime Listeners

Not every registry that modules fill from their deferred registration functions is owned by a
plugin — an application-side registration helper needs the same signal. `Runtime` carries the
non-plugin surface of the *same* hook:

```ts
runtime.registerDeferredRegistrationScopeStartedListener(callback): () => void
runtime.removeDeferredRegistrationScopeStartedListener(callback): void
```

**These are one mechanism, not two.** The listener takes the same `DeferredRegistrationScopeOptions`,
returns the same optional `DeferredRegistrationScopeCompletionFunction`, and is driven from the same
`ModuleManager.#withDeferredRegistrationScope` under the same guarantees. Everything stated above
about ordering, synchronicity, the no-rollback semantics, and errors being logged rather than
propagated applies to listeners verbatim. Never add a second driver, a second payload shape, or a
second error policy for them — the whole point is that a reader learns the contract once.

Plugins are notified before listeners, so an application listener can read what a plugin just reset.
`Runtime._notifyDeferredRegistrationScopeStarted` performs the fan-out and returns the collected
completion functions, which `ModuleManager` appends to the plugins'. It is framework internal
(`_` prefix) and throws from a `RuntimeScope`: observing the boundary is allowed from a scope,
driving it is not.

**Prefer the plugin hook when the registry lives in a plugin** — nothing to subscribe, nothing to
dispose. Reach for a listener only when the state is not in a plugin.

## Key APIs

- `useDeferredRegistrations()` — hook to trigger deferred phase
- `mergeDeferredRegistrations()` — utility to combine deferred data
- `Plugin.onDeferredRegistrationScopeStarted()` — optional plugin lifecycle hook
- `runtime.registerDeferredRegistrationScopeStartedListener()` — the same hook, for non plugin consumers

## Relevant Source

- `packages/firefly/src/` — deferred registration logic
- `packages/core/src/registration/ModuleManager.ts` — scope bracket, plugin hook and listener driver
- `packages/core/src/plugins/Plugin.ts` — the hook and its option types
- `packages/core/src/runtime/Runtime.ts` — the listener surface and its fan-out
- `packages/react-router/src/NavigationItemRegistry.ts` — static/deferred tagging, clear and replay
- User docs: `docs/essentials/`, `docs/reference/registration/`, `docs/reference/plugins/Plugin.md`

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
