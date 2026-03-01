# ADR-0015: Composable Nested Layouts via Cross-Module Route Nesting

## Status

accepted

## Context

React Router supports nested routes for composable layouts, but in a modular application, modules are independently developed and loaded concurrently via `Promise.allSettled`. Module A may define a layout route at `/dashboard`, and Module B may want to render its pages under that layout at `/dashboard/analytics` — without either module having a direct dependency on the other.

## Options Considered

1. **Flat route tree** — All module routes are siblings at the top level. Modules cannot share layouts, leading to duplicated UI wrappers across modules.
2. **Explicit module dependencies** — Modules declare dependencies and pass layout references directly. Couples modules together and breaks autonomy.
3. **Cross-module nesting via `parentPath`/`parentId`** — Any module can register a route under any previously registered route from any other module by referencing the parent's path or `$id`. Combined with the pending registration queue (ADR-0006), registration order does not matter.

## Decision

Option 3. The `registerRoute` function accepts `parentPath` and `parentId` options. `RouteRegistry.add()` resolves the parent via a `Map<string, Route>` index and nests the child route under it. If the parent doesn't exist yet, the route enters the pending registration queue (ADR-0006) and is automatically resolved when the parent registers.

Evidence: `packages/react-router/src/RouteRegistry.ts` — the `add()` method (lines 210-225) resolves `parentPath`/`parentId`, and `#addNestedRoutes()` (lines 253-291) performs the actual nesting. Documentation at `docs/essentials/register-routes.md`.

## Consequences

- True cross-module layout composition — Module A defines a layout, Module B nests under it, with zero coupling.
- Combined with ADR-0006 (pending queue), registration order is irrelevant.
- Misconfigured parent references are caught by strict mode validation in development.
- The route index (`#routesIndex`) grows with each registered route, trading memory for O(1) parent lookup.
