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

Properties: `$id`, `$label`, `to`, `$priority`, `$canRender`, `$additionalProps`.
Supports nested sections, dynamic segments, and multiple menus (root + custom page menus).

## Rendering Navigation

- `useNavigationItems()` — retrieves raw registered items.
- `useRenderedNavigationItems()` — returns items processed for rendering (applies `$canRender`, sorting by `$priority`).

## AppRouter

Wraps React Router. Assembles all registered routes and orchestrates data fetching via
`waitForPublicData` and `waitForProtectedData` props. Use `useIsBootstrapping()` to show
a loading state until modules and data are ready.

## Relevant Source

- `packages/react-router/src/` — route and navigation registration
- `packages/firefly/src/` — AppRouter, bootstrapping hooks
- User docs: `docs/reference/routing/` and `docs/essentials/`

---
*See [ARCHITECTURE.md](../../ARCHITECTURE.md) for full context.*
