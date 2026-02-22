# ADR-0006: Pending Registration Queue for Order-Independent Module Loading

## Status

accepted

## Context

Modules register concurrently via `Promise.allSettled`, so there is no guaranteed ordering. Module A may register a nested route under a path owned by Module B, but Module B might not have registered yet. The same applies to navigation items — a module may register a navigation item under a parent menu owned by another module that hasn't registered yet. Without a queue mechanism, modules would need to declare dependencies on each other, breaking the fundamental module autonomy principle (ADR-0003).

## Options Considered

1. **Require specific registration order** — Simpler but fragile and breaks module autonomy.
2. **Fail immediately if parent not found** — Strict ordering enforcement. Would require dependency declaration between modules.
3. **Pending registration queue** — Queue routes/nav items whose parent doesn't exist yet. Resolve automatically when the parent registers.

## Decision

Option 3. Both `RouteRegistry` and `NavigationItemRegistry` maintain a `#pendingRegistrationsIndex` (a `Map` keyed by the expected parent path or ID). When `add()` is called and the parent doesn't exist yet, the route or navigation item is queued. When a parent route later registers, `#tryRegisterPendingRoutes` resolves all queued children recursively (a queued child may itself be the parent of other queued items).

After all modules are ready, strict mode validation (`_validateRegistrations` on the runtime, surfaced by `useStrictRegistrationMode`) checks for unresolved pending registrations. In development mode, unresolved items throw an error with a diagnostic message identifying the orphaned route/nav item and the missing parent. In production, the warning is logged but does not throw, to avoid crashing the application over a configuration issue.

Evidence: `packages/react-router/src/RouteRegistry.ts` (lines 119-121 for the pending index, lines 179-198 for `#tryRegisterPendingRoutes`). `packages/react-router/src/NavigationItemRegistry.ts` (lines 151-153 for the parallel pending index). `packages/firefly/src/useStrictRegistrationMode.ts` drives validation after the `modules-registered` lifecycle event.

## Consequences

- True module autonomy — modules register in any order without coordination.
- Both routes and navigation items benefit from the same queue/resolve pattern, providing consistent behavior across the two registries.
- Misconfigured parent references are caught by strict mode validation in development (throws) and logged in production (no crash).
- Recursive resolution handles multi-level nesting: grandchild routes queued before their parent and grandparent both resolve correctly once the chain completes.
- Slightly more complex registry implementation, but the complexity is isolated to the two registry classes.
