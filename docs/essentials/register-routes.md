---
order: 500
toc:
    depth: 2-3
---

# Register routes

Routes are the first pillar of the Squide modular experience. By allowing consumers to register dynamic routes, Squide enables developers to build scalable modular applications with well-defined boundaries.

Below are the most common use cases. For more details, refer to the [reference](../reference/runtime/FireflyRuntime.md) documentation.

## Register a basic route

Typically, simple routes using only the `path` and `element` options will be defined:

```tsx !#5-8
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx"

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />
    });
};
```

## Register a route with an id

The `registerRoute` function accepts a `parentId` option, allowing a route to be [nested under an existing parent route](#register-a-nested-route). When searching for the parent route matching the `parentId` option, the `parentId` will be matched against the `$id` option of every route.

Here's an example of a "pathless" route with an id:

```tsx !#6
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        $id: "error-boundary",
        element: <RootErrorBoundary />
    });
};
```

## Register a nested route

React router [nested routes](https://reactrouter.com/en/main/start/tutorial#nested-routes) enable applications to render nested layouts at various points within the router tree. This is quite helpful for modular applications as it enables composable and decoupled UI.

To fully harness the power of nested routes, the `registerRoute` function allows a route to be registered **under any** previously **registered route**, even if that route was registered by another module. The only requirement is that the **parent route** must have been registered with the `registerRoute` function.

When registering a new route with the `registerRoute` function, to render the route under a parent route, specify a `parentPath` option that matches the parent route's `path` option:

```tsx !#9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/layout/page-1",
        element: <Page />
    }, { 
        parentPath: "/layout" // Register the route under an existing route having "/layout" as its "path".
    });
};
```

Or a `parentId` option that matches the parent route's `$id` option:

```tsx !#9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />
    }, { 
        parentId: "error-boundary" // Register the route under an existing route having "error-boundary" as its "$id".
    });
};
```

!!!tip
The `path` option of a route rendered under an existing parent route must be a React Router absolute path (a path starting with a `/`). For example, if a parent route `path` is `/layout`, the `path` option of a route rendered under that parent route and responding to the `/page-1` url, should be `/layout/page-1`.
!!!

Routes can also be nested by registering multiple routes in a **single registration block**:

```tsx !#8-12
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/layout",
        element: <Layout />,
        children: [{
            path: "/layout/page-1",
            element: <Page />
        }]
    });
};
```

A single registration block routes can also be define routes with **relative paths** (rather than starting with a `/`):

```tsx !#7,10
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "layout",
        element: <Layout />,
        children: [{
            path: "page-1",
            element: <Page />
        }]
    });
};
```

## Register an hoisted route

Unlike a regular route, a hoisted route is added directly at the root of the router. This gives it full control over its rendering, as it is not nested under any root layouts. To mark a route as hoisted, include the `hoist` option in the route configuration:

```tsx !#9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />
    }, {
        hoist: true
    });
};
```

==- What does "hoist" means?
Package managers supporting workspaces such as Yarn and NPM call this mechanism "hoisting", which means "raise (something) by means of ropes and pulleys". This is exactly what we are trying to achieve here.

Squide has a built-in hoist functionality capable of raising module routes marked as hoist at the root of the routes array, before the root layout declaration. Thus, an hoisted route will not be wrapped by the root layout component (or any components) and will have full control over its rendering.

In this example, if we defined both an authentication boundary and a root layout, `page-1` would become a sibling of the authentication boundary rather than one of its children:

``` !#2
root
├── Page 1   <---------------- Raise the page here
├── Authentication boundary
├────── Root layout
```
===

!!!tip
To **avoid breaking** the entire **application** when an hoisted route encounters unhandled errors, it is highly recommended to declare a React Router's [errorElement](https://reactrouter.com/en/main/route/error-element) property for each hoisted route.
!!!

!!!tip
If the hoisted route requires an authentication, make sure to **wrap** the route **with** an **authentication boundary** or to handle the authentication within the route.
!!!

## Register a public route

When registering a route, a value can be provided indicating whether the route is `"public"` or `"protected"`. This is especially useful when dealing with code that **fetches global data for protected routes** (e.g. a session). Although a route definition accepts a `$visibility` value, we recommended using the runtime `registerPublicRoute` function to register a **root** public route instead.

```tsx !#5-8
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerPublicRoute({
        path: "/page-1",
        element: <Page />
    });
};
```

To define a nested route as public, use the `$visibility` option:

```tsx !#11
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerPublicRoute({
        path: "/layout",
        element: <Layout />,
        children: [
            {
                $visibility: "public",
                path: "/page-1",
                element: <Page />,
            }
        ]
    });
};
```

!!!tip
When no `$visibility` indicator is provided, a route is considered `protected`.
!!!
