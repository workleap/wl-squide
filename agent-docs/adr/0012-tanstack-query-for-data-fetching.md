# ADR-0012: TanStack Query as Official Data-Fetching Library

## Status

accepted

## Context

Prior to Firefly v9.0, Squide applications used custom callback-based data fetching through `AppRouter` props (`onLoadPublicData`, `onLoadProtectedData`, `isPublicDataLoaded`, `onCompleteRegistrations`). This made it challenging to keep global data in sync with server state — there was no standard for cache invalidation, background refetching, or deduplication. The `docs/updating/migrate-to-firefly-v9.0.md` states: "Prior to v9.0, Squide applications couldn't use TanStack Query to fetch global data, making it challenging for Workleap's applications to keep their global data in sync with the server state."

There was no React Router loaders phase — the migration went directly from callbacks to TanStack Query.

## Options Considered

1. **Custom fetch-and-setState patterns** — The existing approach. No standard for cache management, every application reinvented the wheel.
2. **SWR** — Lightweight server-state library. Less feature-rich than TanStack Query for complex orchestration.
3. **TanStack Query** — Full-featured server-state library with built-in cache management, background refetching, query deduplication, and error/loading states.
4. **Proprietary data-fetching abstraction** — Build a Squide-specific solution. Maintenance burden without ecosystem benefits.

## Decision

Option 3. TanStack Query became a peer dependency of `@squide/firefly`. Three new hooks replaced the callback-based API:

- **`usePublicDataQueries`** — Wraps `useQueries` from TanStack Query with an `enabled: canFetchPublicData` guard. Queries only fire when the state machine (ADR-0009) indicates modules are registered and MSW is ready. When data arrives, dispatches `"public-data-ready"` to the state machine. On subsequent data updates, dispatches `"public-data-updated"` to trigger deferred registration re-execution (ADR-0001).
- **`useProtectedDataQueries`** — Same structure but additionally accepts an `isUnauthorizedError` callback. If any query returns a 401, dispatches `"is-unauthorized"` to the state machine, which bypasses bootstrapping to render a login page. Protected data only fetches when the active route is protected (ADR-0005), preventing 401 errors on public pages.
- **`useDeferredRegistrations`** — Monitors `publicDataUpdatedAt` and `protectedDataUpdatedAt` timestamps in the state machine. When data changes, re-executes deferred registration functions with fresh data, allowing navigation items to update dynamically.

The old callback mappings were:
- `onLoadPublicData` + `isPublicDataLoaded` → `usePublicDataQueries`
- `onLoadProtectedData` + `isProtectedDataLoaded` → `useProtectedDataQueries`
- `onCompleteRegistrations` → `useDeferredRegistrations`
- `fallbackElement` → `useIsBootstrapping`

Evidence: `packages/firefly/src/usePublicDataQueries.ts` wraps `useQueries` with lifecycle dispatching. `packages/firefly/src/useProtectedDataQueries.ts` adds 401 detection. `packages/firefly/src/AppRouterReducer.ts` (lines 115-129) handles `public-data-updated` and `protected-data-updated` actions with `Date.now()` timestamps. `docs/updating/migrate-to-firefly-v9.0.md` (lines 169-199, 319-323) documents the full callback-to-hook migration.

## Consequences

- Applications get cache management, background refetching, and query deduplication for free via TanStack Query.
- Navigation items can update dynamically when server state changes — deferred registrations re-execute automatically when data queries return new data.
- The 401 handling is delegated to the consumer via the `isUnauthorizedError` callback, keeping the framework agnostic about authentication strategy (see ADR-0013).
- TanStack Query is now a required peer dependency for all Squide applications.
- The old `AppRouter` callback-based API (`onLoadPublicData`, etc.) was removed entirely — a clean break, not a deprecation period.
