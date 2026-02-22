# ADR-0005: Protected-by-Default Route Visibility

## Status

accepted

## Context

Squide applications have both public pages (login, error) and protected pages (everything requiring authentication). Routes registered by modules need to be placed under the correct layout (authenticated vs. unauthenticated) automatically. Prior to v9.0, route visibility was not formalized — all routes were treated as protected, and the framework required a mandatory wildcard (`*`) route registered by the host. Unknown routes were silently treated as protected, which could expose pages unintentionally.

The Firefly v9.0 migration (`docs/updating/migrate-to-firefly-v9.0.md`) introduced a formal visibility model with a "protected-by-default" philosophy: "the rationale for defaulting to protected is security — forgetting to label a route should never result in an unauthenticated page being accessible."

## Options Considered

1. **No automatic segmentation** — Module authors manually specify where routes go. Explicit but error-prone if forgotten.
2. **Single route tree with auth guards** — Individual routes have guards. Common pattern but scatters auth logic across every route component.
3. **Automatic outlet segmentation with protected default** — Routes are placed under `PublicRoutes` or `ProtectedRoutes` outlets based on a `$visibility` property. Default is "protected". Only "hoisted" routes escape segmentation (ADR-0022).

## Decision

Option 3. Routes without explicit visibility default to `"protected"` and are placed under the `ProtectedRoutesOutlet`. Public routes must opt-in via `$visibility: "public"`. A convenience method `registerPublicRoute()` wraps `registerRoute()` with `$visibility: "public"` pre-set, reducing boilerplate for login, error, and other unauthenticated pages.

The host application provides two invisible wrapper routes — `PublicRoutes` and `ProtectedRoutes` — as sentinel objects. These are framework-owned outlet wrappers (see ADR-0024 for `$` prefix convention) that define the layout hierarchy: the auth layout wraps `ProtectedRoutes`, and the public layout wraps `PublicRoutes`. During route registration, `RouteRegistry` inspects each route's `$visibility` and assigns it to the appropriate outlet. If a required outlet is missing from the host's route tree, the framework logs a warning during strict mode validation (ADR-0006).

Evidence: `packages/react-router/src/RouteRegistry.ts` defaults `$visibility` to `"protected"` and performs outlet assignment during `add()`. `packages/react-router/src/outlets.ts` exports `PublicRoutes` and `ProtectedRoutes` as sentinel objects with `PublicRoutesOutletId` and `ProtectedRoutesOutletId`. `docs/updating/migrate-to-firefly-v9.0.md` section "Removed unknown route handling" documents the elimination of the wildcard route requirement.

## Consequences

- Security-conscious default — forgetting to set visibility results in a protected route, not an exposed one.
- The host application defines layout hierarchy once (auth layout wrapping `ProtectedRoutes`, public layout wrapping `PublicRoutes`).
- Modules register routes without needing to know where in the tree they end up — the framework handles placement.
- The `registerPublicRoute()` convenience method makes the common case (login, error pages) concise.
- Strict mode validation catches missing outlets during development before they cause runtime routing failures.
