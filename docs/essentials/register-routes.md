---
order: 500
---

# Register routes

Routes are central to the Squide modular experience. By allowing consumers to register dynamic routes, Squide makes it possible to build scalable modular applications with well-defined boundaries.

Below are the most common use cases. For more details, refer to the [reference](../reference/runtime/FireflyRuntime.md) documentation.

## Register a basic route

```tsx !#3-6
import { Page } from "./Page.tsx"

runtime.registerRoute({
    path: "/page-1",
    element: <Page />
});
```

## Register a route with an id

The `registerRoute` function accepts a `parentId` option, allowing a route to be [nested under an existing parent route](#register-a-nested-route). When searching for the parent route matching the `parentId` option, the `parentId` will be matched against the `$id` option of every route.

```tsx !#4
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

runtime.registerRoute({
    $id: "error-boundary",
    element: <RootErrorBoundary />
});
```

## Register a nested route

React router [nested routes](https://reactrouter.com/en/main/start/tutorial#nested-routes) enable applications to render nested layouts at various points within the router tree. This is quite helpful for modular applications as it enables composable and decoupled UI.

To fully harness the power of nested routes, the `registerRoute` function allows a route to be registered **under any** previously **registered route**, even if that route was registered by another module. The only requirement is that the **parent route** must have been registered with the `registerRoute` function.

When registering a new route with the `registerRoute` function, to render the route under a parent route, specify a `parentPath` option that matches the parent route's `path` option:

```tsx !#7
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/layout/page-1",
    element: <Page />
}, { 
    parentPath: "/layout" // Register the route under an existing route having "/layout" as its "path".
});
```

Or a `parentId` option that matches the parent route's `$id` option:

```tsx !#7
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/page-1",
    element: <Page />
}, { 
    parentId: "error-boundary" // Register the route under an existing route having "error-boundary" as its "$id".
});
```

!!!tip
The `path` option of a route rendered under an existing parent route must be a React Router absolute path (a path starting with a `/`). For example, if a parent route `path` is `/layout`, the `path` option of a route rendered under that parent route and responding to the `/page-1` url, should be `/layout/page-1`.
!!!

Routes can also be nested by registering multiple routes in a **single registration block**:

```tsx !#7-10
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/layout",
    element: <Layout />,
    children: [{
        path: "/layout/page-1",
        element: <Page />
    }]
});
```

A single registration block routes can also be define routes with **relative paths** (rather than starting with a `/`):

```tsx !#5,8
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "layout",
    element: <Layout />,
    children: [{
        path: "page-1",
        element: <Page />
    }]
});
```

## Register an hoisted route

## Register a public route
