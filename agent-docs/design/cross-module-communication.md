# Cross-Module Communication

## Principle

Modules are autonomous and must **never directly import** from other modules. All cross-module
coordination happens through the FireflyRuntime API.

## Event Bus

Pub/sub messaging for decoupled communication between modules. Events are type-safe via module augmentation of the `EventMap` interface (same pattern as `EnvironmentVariables` and `FeatureFlags`). All Squide native events are pre-augmented; consumer apps add their own events:

```ts
// types/event-map.d.ts — consumer augmentation
declare module "@squide/firefly" {
    interface EventMap {
        "tenant-changed": { tenantId: string };
    }
}
```

```tsx
// Dispatch — payload type inferred from EventMap
const dispatch = useEventBusDispatcher();
dispatch("tenant-changed", { tenantId: "abc" });

// Listen — handler payload type inferred from EventMap
const handler = useCallback(data => { /* ... */ }, []);
useEventBusListener("tenant-changed", handler, { once: true });
```

## Plugins

Extensible system for custom cross-cutting concerns. Plugins are registered at initialization
and accessed via `usePlugin(PluginClass)`:

```tsx
const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});

// In a component
const plugin = usePlugin(MyPlugin);
```

`Plugin` (`packages/core/src/plugins/Plugin.ts`) carries one optional lifecycle method,
`onDeferredRegistrationScopeStarted`, which a plugin implements to clear and replay its own
registry along with each deferred registration run. See
[deferred-registrations.md](./deferred-registrations.md#plugin-hook).

A plugin hook whose types live outside `@squide/core` cannot go on the class — it goes on an
interface extending `Plugin` and is duck-typed at the call site, as `FireflyPlugin` does for
`registerHoneycombTrackingListeners`.

`Plugin` also carries an optional **readiness surface**: `isReady()`, `registerReadyListener()` and
`removeReadyListener()`. A plugin implements it when it performs asynchronous work the application
must wait for before rendering (the i18next plugin loading the resources of the current language).
`@squide/firefly` consumes it generically: `useAppRouterReducer` reads every plugin's `isReady()` at
initialization and subscribes to the not-ready ones, dispatches a single `plugins-ready` action once
all of them are ready, and `useIsBootstrapping` waits on that flag. Firefly never imports
`@squide/i18next`: doing so would push its three peer dependencies onto every firefly consumer. A
plugin without the surface is always ready, and `squide-plugins-ready` is only dispatched when at
least one plugin implements the surface, so existing applications observe no new event.

Readiness is a one-way latch and its listeners fire once: a consumer must read `isReady()` before
subscribing, a plugin that is already ready may never call a listener registered afterwards. A
plugin must flip the latch when its work fails as well, otherwise the application stays on its
bootstrapping fallback forever. See ADR-0009 for the bootstrapping state machine.

## Shared Types

Modules share **types and interfaces only** through dedicated shared packages (e.g., a `shared/`
workspace package). They never share state, data, or runtime instances.

## Relevant Source

- `packages/core/src/` — event bus and plugin system
- User docs: `docs/reference/messaging/`, `docs/reference/runtime/`

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
