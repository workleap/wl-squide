---
order: 340
label: Define error boundaries
---

# Define error boundaries

Squide uses React Router's [error boundary system](https://reactrouter.com/how-to/error-boundary) to isolate failures when possible and to catch unhandled errors. This page explains how Squide integrates with React Router's error boundaries and how to define them at different levels of your application.

## Handle unmanaged errors

Every application should at least define a root error boundary. It acts as the final safety net, catching any unhandled errors that escape the rest of the application.

To create a root error boundary, refer to the [register the root layout](../introduction/create-host.md#register-the-root-layout) section of the [create an host application](../introduction/create-host.md) guide and wrap the `RootLayout` in a pathless route that defines an [errorElement](https://reactrouter.com/api/components/Route#errorelement) property:

```tsx !#8
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Pathless route to declare a root error boundary.
        errorElement: <RootErrorBoundary />,
        children: [{
            // Pathless route to declare a root layout.
            element: <RootLayout />,
            children: [
                // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
                PublicRoutes,
                ProtectedRoutes
            ]
        }]
    }, {
        hoist: true
    });
};
```

==- :icon-file-code: Root error boundary example
```tsx !#6,9,11,16 ./RootErrorBoundary.tsx
import { isGlobalDataQueriesError } from "@squide/firefly";
import { useCallback, useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

export function RootErrorBoundary() {
    const error = useRouteError() as Error;

    useEffect(() => {
        if (isRouteErrorResponse(error)) {
            // ...
        } else if (isGlobalDataQueriesError(error)) {
            // ...
        } else {
            // ...
        }
    }, [error]);

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred and the application is broken, try refreshing your browser.</p>
        </div>
    );
}
```
===

## Handle module errors

A failure in a single module can potentially break the entire application. To isolate module-level errors, refer to the [register the root layout](../introduction/create-host.md#register-the-root-layout) section of the [create an host application](../introduction/create-host.md) guide as a starting point and wrap the [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRouter](../reference/routing/protectedRoutes.md) placeholders in a pathless route that provides an [errorElement](https://reactrouter.com/api/components/Route#errorelement) property:

```tsx !#11
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";
import { ModuleErrorBoundary } from "./ModuleErrorBoundary.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Pathless route to declare a root layout.
        element: <RootLayout />,
        children: [{
            // Pathless route to declare a module error boundary.
            errorElement: <ModuleErrorBoundary />,
            children: [
                // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
                PublicRoutes,
                ProtectedRoutes
            ]
        }]
    }, {
        hoist: true
    });
};
```

==- :icon-file-code: Module error boundary example
```tsx !#5,8,13 ./ModuleErrorBoundary.tsx
import { useCallback, useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ModuleErrorBoundary() {
    const error = useRouteError() as Error;

    useEffect(() => {
        if (isRouteErrorResponse(error)) {
            // ...
        } else {
            // ...
        }
    }, [error]);

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred but you can still use the application.</p>
        </div>
    );
}
```
===

==- :icon-light-bulb: Similarities with iframe-based architectures
One of the key characteristics of a modular implementation such as [iframes](https://martinfowler.com/articles/micro-frontends.html#Run-timeIntegrationViaIframes) is the ability to isolate failures within individual iframe, preventing them from breaking the entire application.

However, this characteristic is not inherent to a standard Squide implementation as all the modules share the same browsing context (e.g. the same [Document object](https://developer.mozilla.org/en-US/docs/Web/API/Document), the same [Window object](https://developer.mozilla.org/en-US/docs/Web/API/Window), and the same DOM). A failure in one module can potentially breaks the entire application. 

That said, a Squide application can achieve near-iframe-level failure isolation by leveraging React Router's [Outlet](https://reactrouter.com/api/components/Outlet) along with the [errorElement](https://reactrouter.com/api/components/Route#errorelement) property of a React Router's routes. This approach allows individual routes (and their associated modules) to handle errors gracefully, preventing them from cascading and affecting the rest of the app.
=== 

## Handle route errors

While we don't recommend defining an error boundary for **every** route, there are cases where it makes sense to catch errors within a specific route or any of its descendants, rather than letting a failure crash an entire module, or even the whole application.

To define an error boundary for a specific route and its descendants, add an [errorElement](https://reactrouter.com/api/components/Route#errorelement) property to the route definition:

```tsx !#9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";
import { RouteErrorBoundary } from "./RouteErrorBoundary.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />,
        errorElement: <RouteErrorBoundary />
    });
};
```

==- :icon-file-code: Route error boundary example
```tsx !#5,8,13 ./RouteErrorBoundary.tsx
import { useCallback, useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

export function RouteErrorBoundary() {
    const error = useRouteError() as Error;

    useEffect(() => {
        if (isRouteErrorResponse(error)) {
            // ...
        } else {
            // ...
        }
    }, [error]);

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred but you can still use the application.</p>
        </div>
    );
}
```
===

## Not found page

A no-match route can be defined to catch invalid or unknown URLs. To do this, register a route with `*` as the `path`:

```tsx !#6
import { type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { NotFoundPage } from "./NotFoundPage.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });
};
```

```tsx ./NotFoundPage.tsx
export function NotFoundPage() {
    return (
        <div>Not found! Please try another page.</div>
    );
}
```
