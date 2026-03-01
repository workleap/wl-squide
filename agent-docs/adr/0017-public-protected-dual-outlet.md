# ADR-0017: Public/Protected Dual-Outlet Architecture

## Status

accepted

## Context

Prior to Firefly v9.0, a single `ManagedRoutes` placeholder collected all module-registered routes without distinguishing between public and protected pages. The host application had no straightforward way to place an authentication boundary between public routes (login, 404) and protected routes (dashboard, settings). This made it difficult to define distinct layout hierarchies for authenticated vs. unauthenticated sections of the application.

## Options Considered

1. **Single `ManagedRoutes` placeholder** — All routes go through one outlet. The host must use runtime checks inside the layout to conditionally render authentication logic. No structural separation.
2. **Per-route authentication wrappers** — Each module wraps its own routes with auth logic. Duplicates auth concerns across modules and breaks the centralized authentication boundary pattern.
3. **Dual outlets: `PublicRoutes` and `ProtectedRoutes`** — Two sentinel route objects that the host places in its route tree. Routes are automatically sorted into the correct outlet based on their `$visibility` property.

## Decision

Option 3. Two sentinel route objects — `PublicRoutes` (`$id: "__squide-public-routes-outlet__"`, `$visibility: "public"`) and `ProtectedRoutes` (`$id: "__squide-protected-routes-outlet__"`, `$visibility: "protected"`) — are exported from `@squide/react-router`. When `RouteRegistry.add()` processes a non-hoisted route without an explicit parent, it automatically assigns the route to `PublicRoutesOutletId` if `$visibility === "public"`, otherwise to `ProtectedRoutesOutletId`. The canonical host route tree becomes: `RootLayout → PublicRoutes + AuthenticationBoundary → AuthenticatedLayout → ProtectedRoutes`.

Evidence: `packages/react-router/src/outlets.ts` defines the two sentinel objects. `packages/react-router/src/RouteRegistry.ts` (lines 213-217) performs the automatic outlet assignment. See `docs/updating/migrate-to-firefly-v9.0.md` line 39: "The `ManagedRoutes` placeholder has been removed, use `PublicRoutes` and `ProtectedRoutes` instead."

## Consequences

- The host application can structurally separate public and protected sections with an authentication boundary between them.
- Modules register public routes via `registerPublicRoute()` and protected routes via `registerRoute()` (protected by default, per ADR-0005).
- Eliminated the need for runtime authentication checks inside shared layout components.
- Two outlets must be registered by the host — if either is missing, routes targeting it enter the pending registration queue.
