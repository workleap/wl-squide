# ADR-0001: Two-Phase Registration with Navigation-Only Deferred Functions

## Status

accepted

## Context

Squide modules need to register routes and navigation items. Some registrations depend on runtime data (feature flags, user permissions) that isn't available at bootstrap. However, dynamically adding/removing routes after initial registration creates complexity — React Router's data model assumes a stable route tree.

Starting with Firefly v9.0, deferred registration functions can be **re-executed whenever global data changes** (e.g., TanStack Query refetches). This re-execution capability is essential for keeping conditional navigation items in sync with server state, but it makes dynamic route registration in deferred functions untenable — updating the route registry after bootstrapping could cause React Router instability.

The previous approach (allowing routes in deferred functions) also introduced two internal quirks:

- **Unknown deferred routes were incorrectly treated as "protected"**: When a user initially requested a deferred route, Squide couldn't determine if the route was `public` or `protected` because it wasn't registered yet. The route was assumed `protected` even if the deferred function later registered it as `public`.
- **Mandatory wildcard `*` route**: Squide's bootstrapping would fail if the application didn't include a wildcard route, because deferred routes might not yet exist in the registry at initial render.

## Options Considered

1. **Full dynamic routing** — Allow routes to be added/removed at any time. Complex, risk of breaking React Router internals, and incompatible with deferred function re-execution.
2. **Static-only registration** — All registrations happen once at bootstrap. Simpler but cannot adapt to runtime data for navigation items.
3. **Two-phase registration with navigation-only deferred functions** — Phase 1 registers routes and navigation statically at bootstrap. Phase 2 (deferred) allows only navigation items to be registered/updated when data or flags change. Routes are frozen after Phase 1.

## Decision

Option 3. Routes are frozen after Phase 1 (`registerRoute()` throws if called after modules are registered). Deferred registration callbacks can only register navigation items. Conditional route access is handled by having the route's endpoint return a `403` status code when unauthorized, caught by the nearest error boundary — shifting authorization enforcement from the client routing layer to the API layer.

Evidence: `packages/firefly/src/FireflyRuntime.tsx` throws "Only navigation items can be registered in a deferred registration function." The deferred function receives an `operation` parameter (`"register" | "update"`) to distinguish initial vs. subsequent runs. See `docs/updating/migrate-to-firefly-v9.0.md` section "Removed support for deferred routes" for the full migration rationale.

## Consequences

- The route tree is stable after bootstrap, avoiding dynamic routing complexity.
- Navigation items can adapt to feature flags, permissions, and fetched data — and stay in sync with server state through deferred function re-execution.
- Modules that need conditional routes must register all possible routes in Phase 1 and control access through API-level authorization (403 responses) handled by error boundaries.
- Eliminated the "unknown route treated as protected" quirk and the mandatory wildcard route requirement.
