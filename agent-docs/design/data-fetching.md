# Global Data Fetching

## Overview

Squide orchestrates global data fetching through **TanStack Query** hooks. The AppRouter
coordinates the lifecycle: public data loads first, then protected data, then the page renders.

## Hooks

### usePublicDataQueries

Fetches data needed before rendering any page (public or protected). Called in the
bootstrapping route. Returns a data array matching the query array.

### useProtectedDataQueries

Fetches auth-required data (session, permissions). Takes a second parameter: a function
to detect 401 errors (indicating the user is unauthenticated). Only called for protected pages.

### usePublicDataHandler / useProtectedDataHandler

Lower-level hooks for advanced scenarios where the default query-based approach is insufficient.

## Orchestration Flow

1. Modules register → routes and navigation items determined
2. MSW enabled → request handlers ready (dev only)
3. Page requested → AppRouter determines if public or protected
4. `waitForPublicData` → public queries execute
5. `waitForProtectedData` → protected queries execute (if protected page)
6. `useIsBootstrapping()` returns false → page renders
7. Deferred registrations re-run with fresh data

## Error Handling

- `GlobalDataQueriesError` — thrown when data queries fail
- `isGlobalDataQueriesError()` — utility to check error type in error boundaries

## Page-Level Data

For page-specific data (not global), use `useSuspenseQuery` from TanStack Query directly
with `<Suspense>` boundaries. The recommended pattern is a dedicated BFF endpoint per page.

## Relevant Source

- `packages/firefly/src/` — data fetching hooks
- User docs: `docs/reference/global-data-fetching/`, `docs/essentials/`

---
*See [ARCHITECTURE.md](../../ARCHITECTURE.md) for full context.*
