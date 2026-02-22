# ADR-0006: Pending Registration Queue for Order-Independent Module Loading

## Status

accepted

## Context

Modules register concurrently via `Promise.allSettled`, so there is no guaranteed ordering. Module A may register a nested route under a path owned by Module B, but Module B might not have registered yet.

## Options Considered

1. **Require specific registration order** — Simpler but fragile and breaks module autonomy.
2. **Fail immediately if parent not found** — Strict ordering enforcement. Would require dependency declaration between modules.
3. **Pending registration queue** — Queue routes/nav items whose parent doesn't exist yet. Resolve automatically when the parent registers.

## Decision

Option 3. Both `RouteRegistry` and `NavigationItemRegistry` maintain a `#pendingRegistrationsIndex`. When a parent route later registers, `#tryRegisterPendingRoutes` resolves all queued children. After all modules are ready, strict mode validation checks for unresolved pending registrations and throws in development.

Evidence: `packages/react-router/src/RouteRegistry.ts` (lines 119-121, 179-198) and `packages/react-router/src/NavigationItemRegistry.ts` (lines 151-153).

## Consequences

- True module autonomy — modules register in any order without coordination.
- Misconfigured parent references are caught by strict mode validation in development.
- Slightly more complex registry implementation.
