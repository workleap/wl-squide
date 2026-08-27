---
"@squide/core": minor
"@squide/react-router": minor
"@squide/firefly": minor
---

Added `runtime.registerDeferredRegistrationScopeStartedListener(callback)` and `runtime.removeDeferredRegistrationScopeStartedListener(callback)`, the non plugin counterpart of `Plugin.onDeferredRegistrationScopeStarted`.

```ts
const dispose = runtime.registerDeferredRegistrationScopeStartedListener(({ operation }) => {
    // "register" for the initial run, "update" for every subsequent one.
    commandPaletteRegistry.clear();
});

// When the listener is not needed anymore.
dispose();
```

Registration returns a disposer. `removeDeferredRegistrationScopeStartedListener` is there for consumers that prefer to hold onto the callback reference.

## Why

A registry that modules fill from their deferred registration functions needs the same clear-and-replay treatment Squide already gives its navigation items, otherwise an entry registered behind a feature flag survives that flag being turned off for the rest of the session.

`Plugin.onDeferredRegistrationScopeStarted` covers that when the registry lives in a plugin. It often doesn't — an application-side registration helper holds the same kind of per-run state and needs the same signal, without inventing a plugin to hold it.

## One mechanism, two entry points

This is deliberately **not** a second way to do the same thing. The listener takes the same options, returns the same optional completion function, and is driven from the same `ModuleManager` scope bracket as the plugin hook, in the same place, under the same guarantees:

- Notified on **both** the initial run and every update run, before any module's deferred registration function. Plugins are notified first, so a listener can read what a plugin just reset.
- A returned completion function runs once the run has settled, before the runtime's scope is completed, and runs even when the run failed — partial commit, no rollback, the same semantics as the navigation items.
- The listener and its completion function must be synchronous. Nothing awaits them.
- An error thrown by either is logged and swallowed; one faulty listener never fails a run.
- Listeners are notified in registration order.

**Prefer the plugin hook when the registry lives in a plugin** — there is nothing to subscribe and nothing to dispose. Reach for a listener only when the state isn't owned by a plugin.

The listeners are also reachable from the `RuntimeScope` instance that modules receive: observing the boundary is allowed, even though starting or completing a scope is not.

## Are you affected

No. This release is purely additive; existing code is unaffected.
