# Routing and Navigation

## Route Registration

Modules register routes via `runtime.registerRoute()` in their register function:

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />
    });
};
```

## Route Types

| Type | Description | Usage |
|------|-------------|-------|
| **Protected** (default) | Requires authentication | Renders under `ProtectedRoutes` placeholder |
| **Public** | No authentication needed | Renders under `PublicRoutes` placeholder |
| **Hoisted** | Raised to root, bypasses layouts | Login pages, auth boundaries |
| **Nested** | Under a parent route | `parentPath` or `parentId` property |

## Navigation Items

Registered alongside routes via `runtime.registerNavigationItem()`:

```tsx
runtime.registerNavigationItem({
    $id: "page-1",
    $label: "Page 1",
    to: "/page-1"
});
```

Properties: `$id`, `$label`, `to`, `$priority`, `$canRender`, `$additionalProps`, `$meta`.
`$additionalProps` is spread onto the component the layout renders; `$meta` is read by the layout and never spread. Put a `highlight` style flag in `$meta`, not `$additionalProps`.
`$priority` is declared on `NavigationLink` and `NavigationSection`, so it is legal at any depth, and `useRenderedNavigationItems` sorts by it at every depth — the sort lives in the `renderItems` recursion, not in the hook body. Ties and unprioritized items keep declaration order. The value is also forwarded to the renderer as the `priority` render prop, for what ordering does not cover. It was root-only until ADR-0026; do not repeat the older claim that a nested `$priority` is ignored.
Supports nested sections, dynamic segments, and multiple menus (root + custom page menus).

## Rendering Navigation

- `useNavigationItems()` — retrieves raw registered items.
- `useRenderedNavigationItems()` — returns items processed for rendering. Sorts by `$priority` at every level, copying each array first since a section's `children` is the registry's own array, and forwards `$priority` as `priority` and `$canRender` as `canRender` to the layout. It never calls `$canRender` itself, executing it is the layout's job.

## AppRouter

Wraps React Router. Assembles all registered routes and orchestrates data fetching via
`waitForPublicData` and `waitForProtectedData` props. Use `useIsBootstrapping()` to show
a loading state until modules and data are ready.

## Relevant Source

- `packages/react-router/src/` — route and navigation registration
- `packages/firefly/src/` — AppRouter, bootstrapping hooks
- User docs: `docs/reference/routing/` and `docs/essentials/`

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
