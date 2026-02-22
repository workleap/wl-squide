# ADR-0009: Framework-Level Bootstrapping State Machine

## Status

accepted

## Context

A Squide application has a complex async startup lifecycle: module registration, MSW initialization, route visibility detection, public data fetch, protected data fetch, deferred registrations, and finally rendering. Each step has ordering dependencies on previous steps. For example, public data must be fetched before determining whether the user is authenticated, which gates protected data fetching, which gates deferred registrations (which may register navigation items based on server data — see ADR-0001).

Beyond React components, non-React consumers need to observe the bootstrapping state. Platform Widgets (standalone scripts injected into pages) and Honeycomb instrumentation (ADR-0003) need to know when modules are registered or when the app is fully bootstrapped — without being inside a React render tree.

## Options Considered

1. **Simple boolean loading flag** — Insufficient for the number of async steps with inter-dependencies.
2. **React Suspense boundaries** — Suspense-based orchestration for each phase. Couples lifecycle to React rendering, excluding non-React consumers.
3. **Formal state machine library** — XState or similar. Adds a dependency for something that can be modeled with a reducer.
4. **AppRouter reducer with compound state** — A React `useReducer` with 12 action types tracking each lifecycle phase, plus a parallel plain-class store for non-React consumers.

## Decision

Option 4. The `AppRouterReducer` manages the following lifecycle ordering:

1. `modules-registered` — All module `register()` functions have completed.
2. `msw-ready` — MSW service worker is active (or skipped if `useMsw: false`).
3. `modules-ready` — The combined gate: modules registered + MSW ready.
4. `route-visibility-detected` — The framework knows whether the user is authenticated (public vs. protected layout).
5. `public-data-ready` — Global public data queries have resolved.
6. `protected-data-ready` — Global protected data queries have resolved (only for authenticated users).
7. `deferred-registrations-updated` — Deferred registration functions have re-executed with fresh data.
8. `feature-flags-updated` — LaunchDarkly flags have been fetched (if enabled).

The `useIsBootstrapping` hook computes readiness from this compound state — it returns `true` until all required phases for the current context (public vs. protected) have completed.

A parallel `AppRouterStore` (plain class, not a React hook) provides identical state to non-React consumers via the event bus (ADR-0003). Every reducer action is mirrored to the event bus as `"squide-${action.type}"`, so Honeycomb instrumentation can build OpenTelemetry traces of the bootstrapping sequence without coupling to React. The `useExecuteOnce` utility ensures initial state synchronization between the React reducer and the store — actions dispatched before the React tree mounts are replayed to the reducer on first render.

Evidence: `packages/firefly/src/AppRouterReducer.ts` (12 action types, line 320 dispatches to event bus). `packages/firefly/src/useIsBootstrapping.ts` combines multiple boolean conditions. `packages/firefly/src/AppRouterStore.ts` provides the non-React parallel. `packages/firefly/src/useExecuteOnce.ts` handles initial state sync.

## Consequences

- Every state transition is explicit and debuggable — logged at debug level and dispatched as events on the event bus.
- `useIsBootstrapping` is the single source of truth for "can we render the page."
- The dual reducer + store architecture ensures both React and non-React consumers observe the same lifecycle. The store will eventually replace the reducer entirely.
- The lifecycle ordering is documented implicitly by the action types — adding a new phase means adding a new action type and updating `useIsBootstrapping`.
