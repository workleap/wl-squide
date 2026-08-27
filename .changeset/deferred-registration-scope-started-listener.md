---
"@squide/core": minor
"@squide/react-router": minor
"@squide/firefly": minor
---

Added `runtime.registerDeferredRegistrationScopeStartedListener(callback)` and `runtime.removeDeferredRegistrationScopeStartedListener(callback)`, which notify a consumer whenever a deferred registration run starts.

```ts
const dispose = runtime.registerDeferredRegistrationScopeStartedListener(operation => {
    // "register" for the initial run, "update" for every subsequent one.
    commandPaletteRegistry.clear();
});

// When the listener is not needed anymore.
dispose();
```

The callback receives a `DeferredRegistrationOperation` — `"register"` or `"update"` — the same value already handed to every deferred registration function as its third argument. Registration returns a disposer, and `removeDeferredRegistrationScopeStartedListener` remains available for consumers that prefer to hold onto the callback reference.

## Why

Only routes and navigation items participate in a deferred registration run. An application that maintains its own registry, filled from the same deferred registration functions, had no way to join the run.

Concretely: an application keeps a command palette registry — a flat, searchable list of navigation destinations — populated from the same deferred registration functions that register the navigation items. When a feature flag flips off, `updateDeferredRegistrations` clears and replays the navigation items, so the sidebar is correct. Nothing cleared the palette, so its entries for that feature survived for the rest of the session. There was no correct place for that registry to reset itself.

The `DeferredRegistrationsUpdateStartedEvent` event could not fill the gap:

- It is dispatched only on the **update** path. The initial run dispatches no equivalent, so a registry that must reset before the first run had nothing to listen to.
- It is dispatched by the `useUpdateDeferredRegistrations` hook, around the call to `moduleManager.updateDeferredRegistrations` rather than inside it. Its ordering relative to the navigation item replay was a property of the hook's statement order, not of the run.

The new listener fires from the scope itself, which brackets **both** paths, so the same callback covers the initial run and every update, and its position relative to the navigation item replay is guaranteed.

## Behavior

- The listener is notified **after** the scope is in place and **before** any deferred registration function runs, so it always observes the state as it was before the run replayed anything.
- Listeners are notified in registration order.
- A throwing listener is logged through the runtime logger and never propagated. Letting it escape would leave the scope open and break every subsequent deferred registration run for the lifetime of the runtime.
- The listeners are also reachable from the `RuntimeScope` instance that modules receive — observing the boundary is allowed, even though starting or completing a scope is not.

## Are you affected

No. This release is purely additive; existing code is unaffected.

`StartDeferredRegistrationScopeOptions` gained an optional `operation` field. If you call `runtime.startDeferredRegistrationScope()` directly — which is uncommon, as the framework drives it through `ModuleManager` — the operation defaults to `"update"` when `transactional` is `true` and `"register"` otherwise, so no call site needs to change.
