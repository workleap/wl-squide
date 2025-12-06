---
order: 451
label: Fetch public global data
---

# Fetch public global data

To make global protected data fetching easier, Squide provides primitives build on top of [Tanstack Query](https://tanstack.com/query) to orchestrate both the data-loading states and the associated UI.

==- :icon-light-bulb: The challenges with global data
At first glance, one might wonder what could be so complicated about fetching the global data of an application. It's only fetches ...right? Well, there are several concerns to take into account for a modular application:

- When in development, the global data cannot be fetched until the Mock Service Worker (MSW) **request handlers** are **registered** and **MSW is ready**.
- To register the MSW request handlers, the **modules** must be **registered** first.
- If the requested page is _public_, only the global public data should be fetched.
- If the requested page is _protected_, **both** the global **public** and **protected data** should be **fetched**.
- The requested page rendering must be delayed until the global data has been fetched.
- A **unique loading spinner** should be displayed to the user during this process, ensuring there's **no flickering** due to different spinners being rendered.
===

For more details, refer to the [reference](../reference/global-data-fetching/usePublicDataQueries.md) documentation.

## Fetch data

:point_right: There are four key steps to fetch global public data:

- Set the `waitForPublicData` prop of the [AppRouter](../reference/routing/AppRouter.md) component to `true`.
- Fetch the data using the [usePublicDataQueries](../reference/global-data-fetching/usePublicDataQueries.md) hook.
- Use the [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) hook to display a loading spinner while the data is being retrieved.
- Forward the data to the pages through a [React context](https://react.dev/learn/passing-data-deeply-with-context).

Here's an example:

```tsx !#7-22,24-26,29,31,37
import { AppRouter, usePublicDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FetchCountContext } from "@sample/shared";

function BootstrappingRoute() {
    const [fetchCount] = usePublicDataQueries([
        {
            queryKey: ["/api/count"],
            queryFn: async () => {
                const response = await fetch("/api/count");

                if (!response.ok) {
                    throw new Error("Cannot fetch data!");
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
        <AppRouter waitForPublicData>
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

```ts @sample/shared
import { createContext, useContext } from "react";

export const FetchCountContext = createContext(0);

export function useFetchCount() {
    return useContext(FetchCountContext);
}
```

==- :icon-file-code: Setup the MSW handler used in the example
First, define an MSW request handler that returns the number of times it has been fetched:

```ts mocks/handlers.ts
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

```ts
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly"; 

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW code to the production bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
}
```
===

==- :icon-file-code: Use the global data in a page
```tsx !#4
import { useFetchCount } from "@sample/shared";

export function Page() {
    const fetchCount = useFetchCount();

    const isOdd = fetchCount % 2 === 0;

    return (
        <p style={{ backgroundColor: isOdd ? "green" : undefined }}>
            When the fetch count is odd, the background should be green.
        </p>
    )
}
```
===

## Handle fetch errors

The `usePublicDataQueries` hook can throw [GlobalDataQueriesError](../reference/global-data-fetching/isGlobalDataQueriesError.md#globaldataquerieserror) instances, which are typically **unmanaged** and should be handled by an error boundary. To assert in an error boundary that an error is an instance of `GlobalDataQueriesError`, use the [isGlobalDataQueriesError](../reference/global-data-fetching/isGlobalDataQueriesError.md) function:

```tsx !#10
import { useLogger, isGlobalDataQueriesError } from "@squide/firefly";
import { useLocation, useRouteError } from "react-router/dom";

export function ErrorBoundary() {
    const error = useRouteError() as Error;
    const location = useLocation();
    const logger = useLogger();

    useEffect(() => {
        if (isGlobalDataQueriesError(error)) {
            logger
                .withText(`[shell] An unmanaged error occurred while rendering the route with path ${location.pathname} ${error.message}`)
                .withError(error.errors)
                .error();
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

## Setup TanStack Query

Fetching data with the `usePublicDataQueries` hook requires [TanStack Query](https://tanstack.com/query/latest) to be configured. To set it up, follow the [Setup TanStack Query](../integrations/setup-tanstack-query.md) integration guide.
