# ADR-0003: Event Bus for Cross-Module Communication

## Status

accepted

## Context

Modules in a Squide application are independent — they should not import from or know about each other. Yet some cross-module coordination is needed (e.g., notifying other modules of a language change or a user action). Beyond consumer-facing communication, the framework itself needs an internal coordination mechanism — the bootstrapping state machine (ADR-0009) produces lifecycle events that Honeycomb telemetry and non-React consumers need to observe without coupling to React rendering.

## Options Considered

1. **Shared global state store** — A Redux/Zustand store shared across modules. Creates tight coupling around store shape.
2. **Direct module-to-module imports** — Modules import from each other via a registry. Breaks module autonomy.
3. **Pub/sub event bus** — Fire-and-forget events via `eventemitter3`. Modules publish and subscribe without knowing who is on the other end.
4. **React Context-based communication** — Shared providers that modules read/write. Couples modules to React rendering and limits non-React consumers.

## Decision

Option 3. The event bus wraps `eventemitter3` and is created once in the `Runtime` constructor, shared across the entire application. It serves a dual purpose: consumer-facing pub/sub for cross-module coordination, and internal lifecycle event broadcasting. Every AppRouter state machine action is mirrored to the event bus with a `"squide-"` prefix (e.g., `"squide-modules-registered"`, `"squide-public-data-ready"`). The Honeycomb instrumentation (`registerHoneycombInstrumentation.ts`) is the largest internal consumer, subscribing to lifecycle events to build OpenTelemetry traces without coupling to the bootstrapping logic.

Consumer-facing hooks (`useEventBusDispatcher`, `useEventBusListener`) are typed via generics. The recommended pattern is for shared packages to define typed event name unions and re-export typed hooks (e.g., `useApplicationEventBusDispatcher = useEventBusDispatcher<MessageTypes>`), so modules never import from each other — they only share the type definition.

Evidence: `packages/core/src/messaging/EventBus.ts` wraps `EventEmitter` with typed `addListener`, `removeListener`, `dispatch`. `packages/firefly/src/AppRouterReducer.ts` (line 320) dispatches `squide-${action.type}` for every state transition. `packages/firefly/src/honeycomb/registerHoneycombInstrumentation.ts` subscribes to lifecycle events for trace instrumentation. `samples/basic/shared/src/eventBus.ts` shows the typed consumer pattern.

## Consequences

- Maximum module autonomy — no module needs to know about any other module's existence.
- Modules can be added/removed without breaking coupling.
- The framework's internal lifecycle is observable by non-React code (Honeycomb, Platform Widgets) via the same event bus.
- Every dispatch is logged at debug level, making event flow traceable during development.
- Complex coordination requires careful event choreography rather than simple function calls.
