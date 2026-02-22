# ADR-0009: Framework-Level Bootstrapping State Machine

## Status

accepted

## Context

A Squide application has a complex async startup lifecycle: module registration, MSW initialization, route visibility detection, public data fetch, protected data fetch, deferred registrations, and finally rendering. Each step has ordering dependencies on previous steps.

## Options Considered

1. **Simple boolean loading flag** — Insufficient for the number of async steps with inter-dependencies.
2. **React Suspense boundaries** — Suspense-based orchestration for each phase. Couples lifecycle to React rendering.
3. **Formal state machine library** — XState or similar. Adds a dependency for something that can be modeled with a reducer.
4. **AppRouter reducer with compound state** — A React `useReducer` with 12+ action types tracking each lifecycle phase.

## Decision

Option 4. The `AppRouterReducer` manages actions like `modules-registered`, `modules-ready`, `msw-ready`, `public-data-ready`, `protected-data-ready`, `feature-flags-updated`, `deferred-registrations-updated`, etc. The `useIsBootstrapping` hook computes readiness from this compound state.

Evidence: `packages/firefly/src/AppRouterReducer.ts` (12 action types). `packages/firefly/src/useIsBootstrapping.ts` combines multiple boolean conditions. A parallel `AppRouterStore` (plain class) provides the same state to non-React consumers.

## Consequences

- Every state transition is explicit and debuggable (logged and dispatched as events).
- `useIsBootstrapping` is the single source of truth for "can we render the page."
- The dual reducer + store exists because non-React code (e.g., Platform Widgets) needs access to the state. Eventually the reducer should be deprecated in favor of the store.
