---
order: 100
toc:
    depth: 2-3
---

# usePublicDataQueries

Execute the specified [Tanstack queries](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) once the modules are ready and, if applicable, [Mock Service Worker](https://mswjs.io/) is also ready.

!!!warning
Use this hook to **fetch** public global data during the **bootstrapping phase** of your application. Avoid using it in product feature components.
!!!

## Reference

```ts
const results = usePublicDataQueries(queries: [])
```

### Parameters

- `queries`: An array of [QueriesOptions](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries).

### Returns

An array of query response data. The order returned is the same as the input order.

### Throws

If an unmanaged error occur while performing any of the fetch requests, a [GlobalDataQueriesError](./isGlobalDataQueriesError.md#globaldataquerieserror) is thrown.

## Usage

### Define queries

A `BootstrappingRoute` component is introduced in the following example because this hook must be rendered as a child of `rootRoute`.

```tsx !#7-20,22-24,37,47 host/src/App.tsx
import { usePublicDataQueries, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, FeatureFlagsContext, type FeatureFlags } from "@sample/shared";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([
        {
            queryKey: ["/api/feature-flags"],
            queryFn: async () => {
                const response = await fetch("/api/feature-flags");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                return (await response.json()) as FeatureFlags;
            }
        }
    ]);

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

```ts shared/src/apiError.ts
export class ApiError extends Error {
    readonly #status: number;
    readonly #statusText: string;
    readonly #stack?: string;

    constructor(status: number, statusText: string, innerStack?: string) {
        super(`${status} ${statusText}`);

        this.#status = status;
        this.#statusText = statusText;
        this.#stack = innerStack;
    }

    get status() {
        return this.#status;
    }

    get statusText() {
        return this.#statusText;
    }

    get stack() {
        return this.#stack;
    }
}
```

#### `waitForPublicData` & `useIsBootstrapping`

To ensure the `AppRouter` component wait for the public data to be ready before rendering the requested route, set the [waitForPublicData](../routing/appRouter.md#delay-rendering-until-the-public-data-is-ready) property to `true`.

Combine this hook with the [useIsBootstrapping](../routing/useIsBootstrapping.md) hook to display a loader until the public data is fetched and the application is ready.

### Handle fetch errors

This hook throws [GlobalDataQueriesError](./isGlobalDataQueriesError.md#globaldataquerieserror) instances, which are typically **unmanaged** and should be handled by an error boundary. To assert that an error is an instance of `GlobalDataQueriesError`, use the [isGlobalDataQueriesError](./isGlobalDataQueriesError.md) function.

```tsx !#10 host/src/RootErrorBoundary.tsx
import { useLogger, isGlobalDataQueriesError } from "@squide/firefly";
import { useLocation, useRouteError } from "react-router/dom";

export function RootErrorBoundary() {
    const error = useRouteError() as Error;
    const location = useLocation();
    const logger = useLogger();

    useEffect(() => {
        if (isGlobalDataQueriesError(error)) {
            logger.error(`[shell] An unmanaged error occurred while rendering the route with path ${location.pathname}`, error.message, error.errors);
        }
    }, [location.pathname, error, logger]);

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred and the application is broken, try refreshing your browser.</p>
        </div>
    );
}
```

```tsx !#46 host/src/App.tsx
import { usePublicDataQueries, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, FeatureFlagsContext, type FeatureFlags } from "@sample/shared";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([
        {
            queryKey: ["/api/feature-flags"],
            queryFn: async () => {
                const response = await fetch("/api/feature-flags");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                return (await response.json()) as FeatureFlags;
            }
        }
    ]);

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
                                errorElement: <RootErrorBoundary />,
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
