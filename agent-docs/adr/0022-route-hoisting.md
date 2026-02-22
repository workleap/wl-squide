# ADR-0022: Route Hoisting for Escaping the Root Layout

## Status

proposed

## Context

By default, all routes are placed under the `PublicRoutes` or `ProtectedRoutes` outlet (ADR-0005), which sit inside the root layout and authentication boundary. However, certain pages — such as a standalone login callback or a special-purpose landing page — must render completely outside the root layout and authentication boundary.

## Options Considered

1. **No escape mechanism** — All routes go through the outlet segmentation. Pages needing custom layouts must work within the root layout constraints or use CSS to visually override it.
2. **Separate router instance** — Create a second `RouterProvider` for routes outside the layout. Adds complexity and breaks single-router navigation.
3. **Route hoisting** — A `hoist: true` option on `registerRoute` places the route directly at the root of the router tree, bypassing outlet segmentation and the root layout entirely.

## Decision

Option 3. When `hoist: true` is set and no `parentPath`/`parentId` is provided, `RouteRegistry.add()` skips the automatic outlet assignment and adds the route as a root-level sibling. Hoisting cannot be combined with `parentPath` or `parentId` — the registry validates this and throws if both are provided.

Evidence: `packages/react-router/src/RouteRegistry.ts` — `#validateRouteRegistrationOptions()` (lines 200-208) rejects `hoist` combined with `parentPath`/`parentId`. The `add()` method (lines 213-217) skips outlet assignment when `hoist` is true. Documentation at `docs/recipes/override-the-host-layout.md`.

## Consequences

- Modules can register pages that render outside the authentication boundary and root error boundary.
- Hoisted routes lose the isolation benefits of the root error boundary — modules must provide their own `errorElement`.
- Hoisted routes are not protected by the authentication boundary — the module is responsible for its own authorization logic.
- The term "hoist" borrows from package manager semantics, making the concept intuitive for JavaScript developers.
