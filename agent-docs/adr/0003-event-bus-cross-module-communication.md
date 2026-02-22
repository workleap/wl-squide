# ADR-0003: Event Bus for Cross-Module Communication

## Status

accepted

## Context

Modules in a Squide application are independent — they should not import from or know about each other. Yet some cross-module coordination is needed (e.g., notifying other modules of a language change or a user action).

## Options Considered

1. **Shared global state store** — A Redux/Zustand store shared across modules. Creates tight coupling around store shape.
2. **Direct module-to-module imports** — Modules import from each other via a registry. Breaks module autonomy.
3. **Pub/sub event bus** — Fire-and-forget events via `eventemitter3`. Modules publish and subscribe without knowing who is on the other end.
4. **React Context-based communication** — Shared providers that modules read/write. Couples modules to React rendering.

## Decision

Option 3. The event bus is owned by the `Runtime` and exposed via `useEventBusDispatcher` and `useEventBusListener` hooks.

Evidence: `packages/core/src/messaging/EventBus.ts` wraps `EventEmitter` with typed `addListener`, `removeListener`, `dispatch`. Modules share types only through dedicated shared packages — they never share state or runtime instances.

## Consequences

- Maximum module autonomy — no module needs to know about any other module's existence.
- Modules can be added/removed without breaking coupling.
- Complex coordination requires careful event choreography rather than simple function calls.
