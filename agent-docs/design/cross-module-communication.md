# Cross-Module Communication

## Principle

Modules are autonomous and must **never directly import** from other modules. All cross-module
coordination happens through the FireflyRuntime API.

## Event Bus

Pub/sub messaging for decoupled communication between modules:

```tsx
// Dispatch an event
const dispatch = useEventBusDispatcher();
dispatch("event-name", payload);

// Listen for an event
const handler = useCallback((data, context) => { /* ... */ }, []);
useEventBusListener("event-name", handler, { once: true });
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
*See [ARCHITECTURE.md](../../ARCHITECTURE.md) for full context.*
