# ADR-0026: Global Data Fetching with Public/Protected Segmentation

## Status

proposed

## Context

Squide applications fetch global data (feature flags, user session, subscription info) at bootstrap. Some data is public (available regardless of authentication) while other data is protected (requires an authenticated user). Fetching protected data on a public page (e.g., login) would trigger unauthorized API errors. The bootstrapping state machine (ADR-0009) must coordinate MSW readiness, data fetching, and deferred registrations in the correct order — and must know when to wait for which data stream.

## Options Considered

1. **Single data stream** — Fetch all global data in one step. Simpler but fetches protected data on public pages, causing 401 errors or requiring complex conditional logic inside a single hook.
2. **Module-managed data fetching** — Each module fetches its own global data. Leads to duplicated fetches, race conditions, and no centralized bootstrapping coordination.
3. **Dual data streams: public and protected** — Two separate hooks (`usePublicDataQueries` and `useProtectedDataQueries`) that the AppRouter state machine coordinates independently. The `waitForPublicData` and `waitForProtectedData` flags control which streams block rendering.

## Decision

Option 3. The `AppRouter` component accepts `waitForPublicData` and `waitForProtectedData` props that configure the bootstrapping state machine's initial state. The state machine tracks `isPublicDataReady` and `isProtectedDataReady` independently via `"public-data-ready"` and `"protected-data-ready"` actions. The `activeRouteVisibility` state tracks whether the current route is public or protected — protected data is only fetched when navigating to a protected route.

Evidence: `packages/firefly/src/AppRouterReducer.ts` (lines 11-15) defines the `AppRouterWaitState` with `waitForPublicData` and `waitForProtectedData`. Lines 97-114 handle the `"public-data-ready"` and `"protected-data-ready"` actions independently. Lines 147-162 track `activeRouteVisibility` to determine when protected data fetching should begin.

## Consequences

- Public pages (login, registration) render without triggering protected data fetches, avoiding 401 errors.
- The state machine coordinates the ordering: MSW ready → public data → route visibility determined → protected data → deferred registrations.
- Applications that don't need one of the streams simply omit the corresponding `waitFor*` prop.
- The dual-stream approach adds complexity to the state machine but accurately models the real-world authentication flow.
