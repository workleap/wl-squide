---
order: 900
visibility: hidden
---

# Add a public route

A route can be registered as either `public` or `protected`. This visibility indicator does not determine whether a route is accessible to everyone or restricted to authenticated users; that protection is typically enforced by an [authentication boundary](./add-authentication.md#add-an-authentication-boundary).

In a Squide application, the visibility indicator determines whether routes will be rendered as children of either the [PublicRoutes](../reference/routing/publicRoutes.md) or [ProtectedRoutes](../reference/routing/protectedRoutes.md) placeholders and whether the [usePublicDataQueries](../reference/global-data-fetching/usePublicDataQueries.md) or [useProtectedDataQueries](../reference/global-data-fetching/useProtectedDataQueries.md) hooks should execute their requests. If the initially requested route is marked as `protected` and both hooks are defined, each query hook will execute its respective requests. However, if the route is marked as `public`, only the `usePublicDataQueries` hook will execute its requests.

When a route is registered with the [registerRoute](../reference/runtime/FireflyRuntime.md#register-routes) function, it is considered `protected` by default. Therefore, if a route does not rely on the application's global protected data, it should be explicitly registered as `public` using the [registerPublicRoute](../reference/runtime/FireflyRuntime.md#register-a-public-route) function:

```tsx !#6 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerPublicRoute({
        path: "/page",
        element: <Page />
    });
}
```

Don't forget to register the `PublicRoutes` placeholder in the host application:

```tsx !#9 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });
};
```
