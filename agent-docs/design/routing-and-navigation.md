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

Properties: `$id`, `$label`, `to`, `$priority`, `$canRender`, `$additionalProps`, `$context`.
`$additionalProps` is spread onto the component the layout renders; `$context` is read by the layout and never spread. Put a `highlight` style flag in `$context`, not `$additionalProps`. `$context` is per-item data for the layout and has nothing to do with the module registration context or React context; it was named `$meta` in 9.1.0-9.6.0.
`$priority` is declared on `NavigationLink` and `NavigationSection`, so it is legal at any depth. Squide acts on it for a menu's top-level items only: `useRenderedNavigationItems` sorts the array it receives and recurses into `children` unsorted. At every depth the value is forwarded to the renderer as the `priority` render prop, which is the point of the prop on a nested item — the code rendering the menu sorts a section if it wants to. Do not tell a consumer that Squide orders a nested item, and do not tell them `$priority` is ignored there either.
Supports nested sections, dynamic segments, and multiple menus (root + custom page menus).

## Rendering Navigation

- `useNavigationItems()` — retrieves raw registered items.
- `useRenderedNavigationItems()` — returns items processed for rendering. Sorts the top-level items by `$priority` (the recursion into `children` is unsorted) and forwards `$priority` as `priority` and `$canRender` as `canRender` to the layout at every level. It never calls `$canRender` itself, executing it is the layout's job.

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
