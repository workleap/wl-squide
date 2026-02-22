# ADR-0017: TanStack Query as Official Data-Fetching Library

## Status

accepted

## Context

Prior to Firefly v9.0, Squide applications used custom callback-based data fetching through `AppRouter` props (`onLoadPublicData`, `onLoadProtectedData`, `isPublicDataLoaded`). This made it challenging to keep global data in sync with server state — there was no standard for cache invalidation, background refetching, or deduplication.

## Options Considered

1. **Custom fetch-and-setState patterns** — The existing approach. No standard for cache management, every application reinvented the wheel.
2. **SWR** — Lightweight server-state library. Less feature-rich than TanStack Query for complex orchestration.
3. **TanStack Query** — Full-featured server-state library with built-in cache management, background refetching, query deduplication, and error/loading states.
4. **Proprietary data-fetching abstraction** — Build a Squide-specific solution. Maintenance burden without ecosystem benefits.

## Decision

Option 3. TanStack Query became a peer dependency of `@squide/firefly`. New hooks were introduced: `usePublicDataQueries`, `useProtectedDataQueries`, and `useDeferredRegistrations`. The `react-error-boundary` peer dependency was dropped.

Evidence: `docs/updating/migrate-to-firefly-v9.0.md` states: "Prior to v9.0, Squide applications couldn't use TanStack Query to fetch global data, making it challenging for Workleap's applications to keep their global data in sync with the server state."

## Consequences

- Applications get cache management, background refetching, and query deduplication for free.
- Navigation items can update dynamically when server state changes via deferred registrations.
- TanStack Query is now a required peer dependency for all Squide applications.
- The old `AppRouter` callback-based API (`onLoadPublicData`, etc.) was removed entirely.
