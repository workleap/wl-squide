---
order: 980
---

# Fetch global data

!!!warning
Before going forward with this guide, make sure that you completed the [Setup Mock Service Worker](./setup-msw.md) guide.
!!!

Retrieving the global data of an application is a crucial aspect that isn't always straightforward to implement. That's why we encourage feature teams to build their global data fetching strategy on top of the Squide [AppRouter](../reference/routing/appRouter.md) component.

## Challenges with global data

At first glance, one might wonder what could be so complicated about fetching the global data of an application. It's only fetches ...right? Well, there are several concerns to take into account for a Squide application:

- When in development, the global data cannot be fetched until the Mock Service Worker (MSW) **request handlers** are **registered** and **MSW is ready**.

- To register the MSW request handlers, the **modules** (including the remote modules) must be **registered** first.

- If the requested page is _public_, only the global public data should be fetched.

- If the requested page is _protected_, **both** the global **public** and **protected data** should be **fetched**.

- The requested page rendering must be delayed until the global data has been fetched.

- A **unique loading spinner** should be displayed to the user during this process, ensuring there's **no flickering** due to different spinners being rendered.

To help manage those concerns, Squide offer an `AppRouter` component that takes care of setuping Squide's primitive and orchestrating the different states.

## Fetch public data

### Add an endpoint

First, define in the host application an MSW request handler that returns the number of times it has been fetched:

```ts host/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";

let fetchCount = 0;

export const requestHandlers: HttpHandler[] = [
    http.get("/api/count", () => {
        fetchCount += 1;

        return HttpResponse.json([{
            "count": fetchCount
        }]);
    })
];
```

Then, register the request handler using the module registration function:

```tsx !#7 host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly"; 

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the application bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
}
```

### Create a shared context

Then, in a shared project, create a React context named `FetchCountContext`:

```ts shared/src/fetchCountContext.ts
import { createContext, useContext } from "react";

export const FetchCountContext = createContext(0);

export function useFetchCount() {
    return useContext(FetchCountContext);
}
```

!!!info
Ensure that the shared project is configured as a [shared dependency](./add-a-shared-dependency.md).
!!!

### Create a custom error class

Then, in the same shared project, create a `ApiError` class:

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

### Fetch the data

Finally, update the `App` component to add the [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md) hook. The hook will fetch the data from `/api/count` and forward the retrieved `fetchCount` value through `FetchCountContext`:

```tsx !#7-22,24-26,39 host/src/App.tsx
import { AppRouter, usePublicDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FetchCountContext, ApiError } from "@sample/shared";

function BootstrappingRoute() {
    const [fetchCount] = usePublicDataQueries([
        {
            queryKey: ["/api/count"],
            queryFn: async () => {
                const response = await fetch("/api/count");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                return data.count as number;
            }
        }
    ]);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <FetchCountContext.Provider value={fetchCount}>
            <Outlet />
        </FetchCountContext.Provider>
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

#### `usePublicDataQueries`

The `usePublicDataQueries` hook is a wrapper around TanStack Query's native [useQueries](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) hook. This wrapper coordinates the execution of the queries with the `AppRouter` component's state.

#### `waitForPublicData` & `useIsBootstrapping`

To ensure the `AppRouter` component wait for the public data to be ready before rendering the requested route, set the [waitForPublicData](../reference/routing/appRouter.md#delay-rendering-until-the-public-data-is-ready) property to `true`.

Combine the `usePublicDataQueries` with the [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) hook to display a loader until the public data is fetched and the application is ready.

### Use the endpoint data

Now, create a `GlobalDataLayout` component that uses the count retrieved from `FetchCountContext` and render pages with a green background color if the value is odd:

```tsx !#5,10 host/src/GlobalDataLayout.tsx
import { useFetchCount } from "@sample/shared";
import { Outlet } from "react-router/dom";

export function GlobalDataLayout() {
    const fetchCount = useFetchCount();

    const isOdd = fetchCount % 2 === 0;

    return (
        <div style={{ backgroundColor: isOdd ? "green" : undefined }}>
            <Outlet />
        </div>
    )
}
```

Then, create a `Page` component:

```tsx host/src/Page.tsx
export function Page() {
    return (
        <div>When the fetch count is odd, my background should be green.</div>
    )
}
```

Finally, register both components, either in the host application or within any module:

```tsx !#8,12 host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { GlobalDataLayout } from "./GlobalDataLayout.tsx";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    runtime.registerRoute({
        path: "/global-data",
        element: <GlobalDataLayout />,
        children: [
            {
                index: true,
                element: <Page />
            }
        ]
    });

    runtime.registerNavigationItem({
        $id: "global-data",
        $label: "Global data Page",
        to: "/global-data"
    });

    // Files that includes an import to the "msw" package are included dynamically to prevent adding
    // unused MSW stuff to the application bundles.
    const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

    runtime.registerRequestHandlers(requestHandlers);
}
```

### Try it :rocket:

Start the application in a development environment using the `dev` script and navigate to the `/global-data` page. Refresh the page a few times, the background color should alternate between transparent and green.

#### Troubleshoot issues

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs (including MSW request handlers) and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.

## Fetch protected data

Now, let's load _protected_ data. The process is similar to fetching public data, but this time, we'll use the [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hook instead.

### Add an endpoint

First, define a MSW request handler that returns a user tenant subscription data:

```ts !#14-21 host/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";

let fetchCount = 0;

export const requestHandlers: HttpHandler[] = [
    http.get("/api/count", () => {
        fetchCount += 1;

        return HttpResponse.json([{
            "count": fetchCount
        }]);
    }),

    http.get("/api/subscription", () => {
        // NOTE:
        // The user id should be retrieved from the current session and the subscription should be retrieved from a database with this id.
        // For the sake of simplicity, we haven't done it for this guide, instead we return hardcoded data.
        return HttpResponse.json([{
            "status": "paid"
        }]);
    })
];
```

If you've registered the [public data request handler](#add-an-endpoint), the newly created request handler should be automatically registered.

### Create a shared context

Then, in a shared project, create a `SubscriptionContext`:

```ts shared/src/subscriptionContext.ts
import { createContext, useContext } from "react";

export interface Subscription {
    status: string
}

export const SubscriptionContext = createContext(Subscription | undefined);

export function useSubscription() {
    return useContext(SubscriptionContext);
}
```

!!!info
If you're not adding the `SubscriptionContext` to the shared project created earlier for the public data example, make sure to configure this new shared project as a [shared dependency](./add-a-shared-dependency.md).
!!!

### Fetch the data

Finally, update the `App` component to add the [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hook. The hook will fetch the data from `/api/subscription` and forward the retrieved `subscription` data through `SubscriptionContext`:

```tsx !#24-43,63 host/src/App.tsx
import { AppRouter, usePublicDataQueries, useProtectedDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FetchCountContext, SubscriptionContext, ApiError, isApiError, type Subscription } from "@sample/shared";

function BootstrappingRoute() {
    const [fetchCount] = usePublicDataQueries([
        {
            queryKey: ["/api/count"],
            queryFn: async () => {
                const response = await fetch("/api/count");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                return data.count as number;
            }
        }
    ]);

    const [subscription] = useProtectedDataQueries([
        {
            queryKey: ["/api/subscription"],
            queryFn: async () => {
                const response = await fetch("/api/subscription");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const subscription: Subscription = {
                    status: data.status
                };

                return subscription;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <FetchCountContext.Provider value={fetchCount}>
            <SubscriptionContext.Provider value={subscription}>
                <Outlet />
            </SubscriptionContext.Provider>
        </FetchCountContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter
            waitForMsw
            waitForPublicData
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

#### `useProtectedDataQueries`

The `useProtectedDataQueries` hook is a wrapper around TanStack Query's native [useQueries](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) hook. This wrapper coordinates the execution of the queries with the `AppRouter` component's state.

#### `waitForProtectedData`

To ensure the `AppRouter` component wait for the protected data to be ready before rendering the requested route, set the [waitForProtectedData](../reference/routing/appRouter.md#delay-rendering-until-the-public-data-is-ready) property to `true`.

### Use the endpoint data

Now, update the `GlobalDataLayout` component that was previously created for the [public data example](#use-the-endpoint-data) to render the user tenant subscription status:

```tsx !#6,11 host/src/GlobalDataLayout.tsx
import { useFetchCount, useSubscription } from "@sample/shared";
import { Outlet } from "react-router/dom";

export function GlobalDataLayout() {
    const fetchCount = useFetchCount();
    const subscription = useSubscription();

    const isOdd = fetchCount % 2 === 0;

    return (
        <div>Subscription status: {subscription?.status}</div>
        <div style={{ backgroundColor: isOdd ? "green" : undefined }}>
            <Outlet />
        </div>
    )
}
```

### Try it :rocket:

Start the application in a development environment using the `dev` script and navigate to the `/global-data` page. You should notice the subscription status.

#### Troubleshoot issues

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs (including MSW request handlers) and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.




