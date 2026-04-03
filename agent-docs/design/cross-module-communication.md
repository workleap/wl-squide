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
const handler = useCallback((data?: { tenantId: string }) => { /* ... */ }, []);
useEventBusListener("tenant-changed", handler, { once: true });

// Unmapped events still work (fall back to unknown payload)
dispatch("ad-hoc-event", payload);
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

## Shared Types

Modules share **types and interfaces only** through dedicated shared packages (e.g., a `shared/`
workspace package). They never share state, data, or runtime instances.

## Relevant Source

- `packages/core/src/` — event bus and plugin system
- User docs: `docs/reference/messaging/`, `docs/reference/runtime/`

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
