---
order: 90
toc:
    depth: 2-3
---

# useProtectedDataQueries

Execute the specified [Tanstack queries](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) when the modules are ready, the **active route** is **protected** and, when applicable, [Mock Service Worker](https://mswjs.io/) is ready.

!!!warning
Use this hook to **fetch** protected global data during the **bootstrapping phase** of your application. Avoid using it in product feature components.
!!!

## Reference

```ts
const results = useProtectedDataQueries(queries: [], isUnauthorizedError: (error) => boolean)
```

### Parameters

- `queries`: An array of [QueriesOptions](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries).
- `isUnauthorizedError`: A function that returns a `boolean` value indicating whether or not the provided error is a `401` status code.

### Returns

An array of query response data. The order returned is the same as the input order.

### Throws

If an unmanaged error occur while performing any of the fetch requests, a [GlobalDataQueriesError](./isGlobalDataQueriesError.md#globaldataquerieserror) is thrown.

## Usage

### Define queries

A `BootstrappingRoute` component is introduced in the following example because this hook must be rendered as a child of `rootRoute`.

```tsx !#7-42,44-46,61,71 host/src/App.tsx
import { useProtectedDataQueries, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, SessionContext, SubscriptionContext, type Session, type Subscription } from "@sample/shared";

function BootstrappingRoute() {
    const [session, subscription] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const result: Session = {
                    user: {
                        id: data.userId,
                        name: data.username,
                        preferredLanguage: data.preferredLanguage
                    }
                };

                return result;
            }
        },
        {
            queryKey: ["/api/subscription"],
            queryFn: async () => {
                const response = await fetch("/api/subscription");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                return (await response.json()) as Subscription;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <SessionContext.Provider value={session}>
            <SubscriptionContext.Provider value={subscription}>
                <Outlet />
            </SubscriptionContext.Provider>
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

export function isApiError(error?: unknown): error is ApiError {
    return error !== undefined && error !== null && error instanceof ApiError;
}
```

#### `waitForProtectedData` & `useIsBootstrapping`

To ensure the `AppRouter` component wait for the protected data to be ready before rendering the requested route, set the [waitForProtectedData](../routing/appRouter.md#delay-rendering-until-the-protected-data-is-ready) property to `true`.

Combine this hook with the [useIsBootstrapping](../routing/useIsBootstrapping.md) hook to display a loader until the protected data is fetched and the application is ready.

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

```tsx !#56 host/src/App.tsx
import { useProtectedDataQueries, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, SessionContext, type Session } from "@sample/shared";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const result: Session = {
                    user: {
                        id: data.userId,
                        name: data.username,
                        preferredLanguage: data.preferredLanguage
                    }
                };

                return result;
            }
        }
    ], error => isApiError(error) && error.status === 401);

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

### Handle 401 response

Unauthorized requests are a special case that shouldn't be handled by an error boundary, as this would cause an **infinite loop** with the application's authentication boundary.

To handle this, when the server returns a `401` status code, the `useProtectedDataQueries` hook instructs Squide to immediately render the page, triggering the authentication boundary, that will eventually redirect the user to a login page.

Since Squide manages this process behind the scenes, you only need to register an `AuthenticationBoundary` component and provide an `isUnauthorizedError` handler to the `useProtectedDataQueries` hook.

```tsx host/src/AuthenticationBoundary.tsx
import { useContext } from "react";
import { Outlet, Navigate } from "react-router/dom";
import { SessionContext } from "@sample/shared";

export function AuthenticationBoundary() {
    const session = useContext(SessionContext);

    if (session) {
        return <Outlet />;
    }

    return <Navigate to="/login" />;
}
```

!!!info
The `registerHost` function is registered as a [local module](../registration/registerLocalModules.md) of the host application.
!!!

```tsx !#8 host/src/registerHost.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { AuthenticationBoundary } from "./AuthenticationBoundary.tsx";

export function registerHost() {
    const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
        runtime.registerRoute({
            // Pathless route to declare an authenticated boundary.
            element: <AuthenticationBoundary />,
            children: [
                PublicRoutes,
                ProtectedRoutes
            ]
        }, {
            hoist: true
        });
    };

    return register;
}
```

```tsx !#30 host/src/App.tsx
import { useProtectedDataQueries, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ApiError, SessionContext, type Session } from "@sample/shared";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const result: Session = {
                    user: {
                        id: data.userId,
                        name: data.username,
                        preferredLanguage: data.preferredLanguage
                    }
                };

                return result;
            }
        }
    ], error => isApiError(error) && error.status === 401);

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


