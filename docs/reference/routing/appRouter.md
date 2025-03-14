---
order: 110
toc:
    depth: 2-3
---

# AppRouter

A component that sets up Squide's primitives with a [React Router](https://reactrouter.com/en/main) instance.

!!!warning
The `AppRouter` component is required for any Squide application.
!!!

## Reference

```tsx
<AppRouter waitForMsw={boolean} waitForPublicData={boolean} waitForProtectedData={boolean}>
    {({ rootRoute, registeredRoutes, routerProviderProps }) => ( ... )}
</AppRouter>
```

### Properties

- `waitForMsw`: A `boolean` value indicating whether or not Squide should delay the rendering of the requested page until the [Mock Service Worker](https://mswjs.io/) request handlers are registered.
- `waitForPublicData`: An optional `boolean` value indicating whether or not Squide should delay the rendering of the requested page until the **public** data is ready. The default value is `false`.
- `waitForProtectedData`: An optional `boolean` value indicating whether or not Squide should delay the rendering of the requested page until the **protected** data is ready. The default value is `false`.
- `children`: A render function defining a [RouterProvider](https://reactrouter.com/en/main/routers/router-provider) component with `rootRoute`, `registeredRoutes` and `routerProviderProps`.

## Usage

### Define a router provider

The `rootRoute` component provided as an argument to the `AppRouter` rendering function must always be rendered as a parent of the `registeredRoutes`.

```tsx !#9-17 host/src/App.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

export function App() {
    <AppRouter waitForMsw={false}>
        {({ rootRoute, registeredRoutes, routerProviderProps }) => {
            return (
                <RouterProvider
                    router={createBrowserRouter([
                        {
                            element: rootRoute,
                            children: registeredRoutes
                        }
                    ])}
                    {...routerProviderProps}
                />
            );
        }}
    </AppRouter>
}
```

### Define a loading component

A `BootstrappingRoute` component is introduced in the following example because the [useIsBootstrapping](../routing/useIsBootstrapping.md) hook must be rendered as a child of `rootRoute`.

```tsx !#6-8,24 host/src/App.tsx
import { useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

function BootstrappingRoute() {
    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function App() {
    return (
        <AppRouter waitForMsw={false}>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```


### Define a root error boundary

A React Router [errorElement](https://reactrouter.com/en/main/route/error-element) retrieves the current error using the [useRouteError](https://reactrouter.com/en/main/hooks/use-route-error) hook.

The root error boundary should always wrap the `registeredRoutes` and, when application, the `BootstrapingRoute` component.

```tsx host/src/RootErrorBoundary.tsx
import { useRouteError } from "react-router/dom";

export function RootErrorBoundary() {
    const error = useRouteError();

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred and the application is broken, try refreshing your browser.</p>
        </div>
    );
}
```

```tsx !#15 host/src/App.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

export function App() {
    return (
        <AppRouter waitForMsw={false}>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                errorElement: <RootErrorBoundary />,
                                children: registeredRoutes
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

### Delay rendering until MSW is ready

```tsx !#7 host/src/App.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

export function App() {
    return (
        <AppRouter waitForMsw>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: registeredRoutes
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

### Delay rendering until the public data is ready

A `BootstrappingRoute` component is introduced in the following example because the [usePublicDataQueries](../tanstack-query/usePublicDataQueries.md) hook must be rendered as a child of `rootRoute`.

```tsx !#8,25 host/src/App.tsx
import { useIsBootstrapping, usePublicDataQueries, AppRouter } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FeatureFlagsContext } from "@sample/shared";
import { getFeatureFlagsQuery } from "./getFeatureFlagsQuery.ts";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([getFeatureFlagsQuery]);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <FeatureFlagsContext.Provider value={featureFlags}>
            <Outlet />
        </FeatureFlagsContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter 
            waitForMsw
            waitForPublicData
        >
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

### Delay rendering until the protected data is ready

A `BootstrappingRoute` component is introduced in the following example because the [useProtectedDataQueries](../tanstack-query/useProtectedDataQueries.md) hook must be rendered as a child of `rootRoute`.

```tsx !#8-11,28 host/src/App.tsx
import { useIsBootstrapping, useProtectedDataQueries, AppRouter } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SessionContext, isApiError } from "@sample/shared";
import { getSessionQuery } from "./getSessionQuery.ts";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries(
        [getSessionQuery],
        error => isApiError(error) && error.status === 401
    );

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <SessionContext.Provider value={session}>
            <Outlet />
        </SessionContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter 
            waitForMsw
            waitForProtectedData
        >
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```
