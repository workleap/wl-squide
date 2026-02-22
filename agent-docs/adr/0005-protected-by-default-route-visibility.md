# ADR-0005: Protected-by-Default Route Visibility

## Status

accepted

## Context

Squide applications have both public pages (login, error) and protected pages (everything requiring authentication). Routes registered by modules need to be placed under the correct layout (authenticated vs. unauthenticated) automatically.

## Options Considered

1. **No automatic segmentation** — Module authors manually specify where routes go. Explicit but error-prone if forgotten.
2. **Single route tree with auth guards** — Individual routes have guards. Common pattern but scatters auth logic.
3. **Automatic outlet segmentation with protected default** — Routes are placed under `PublicRoutes` or `ProtectedRoutes` outlets based on a `$visibility` property. Default is "protected". Only "hoisted" routes escape segmentation.

## Decision

Option 3. Routes without explicit visibility default to `"protected"` and are placed under the `ProtectedRoutesOutlet`. Public routes must opt-in via `$visibility: "public"`.

Evidence: `packages/react-router/src/RouteRegistry.ts` defaults `$visibility` to `"protected"`. `packages/react-router/src/outlets.ts` defines `PublicRoutesOutletId` and `ProtectedRoutesOutletId` as invisible wrapper routes.

## Consequences

- Security-conscious default — forgetting to set visibility results in a protected route, not an exposed one.
- The host application defines layout hierarchy once (auth layout wrapping ProtectedRoutes, public layout wrapping PublicRoutes).
- Modules register routes without needing to know where in the tree they end up.
