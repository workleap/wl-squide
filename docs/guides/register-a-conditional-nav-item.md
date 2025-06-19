---
order: 840
---

# Register a conditional navigation item

!!!warning
Before going forward with this guide, make sure that you completed the [Setup Mock Service Worker](./setup-msw.md) and [Fetch global data](./fetch-global-data.md) guides.
!!!

Conditionally registering navigation items based on remote data is complex because **Squide's default registration mechanism runs before the application has bootstrapped**, meaning that the remote data have not yet been fetched from the server.

To address this, Squide offers an alternate [deferred registration](../reference/registration/registerLocalModules.md#defer-the-registration-of-navigation-items) mechanism in two-phases:

1. The first phase allows modules to register their _static_ navigation items that are not dependent on remote data.
2. The second phase enables modules to register _deferred_ navigation items that are dependent on remote data. We refer to this second phase as **deferred registrations**.

To defer a registration to the second phase, a module's registration function can **return an anonymous function** matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`.

Once the modules are registered and the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook is rendered, the deferred registration functions will be executed with either `"register"` or `"update"` as the value for the `operation` argument, depending on whether this is the initial or subsequent execution of the functions.

## Using feature flags as an example

In this guide, we'll use a hypothetical feature flags endpoint as an example. The endpoint returns values that indicate whether specific features are enabled. A navigation item will be registered only if its corresponding feature is active.

## Add an endpoint

First, define a MSW request handler that returns the feature flags:

```ts host/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";

export const requestHandlers: HttpHandler[] = [
    http.get("/api/feature-flags", () => {
        return HttpResponse.json({
            featureA: true,
            featureB: true
        });
    })
];
```

Then, register the request handler using the module registration function:

```tsx host/src/register.tsx
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

## Create a shared context

Next, in a shared project, create a `FeatureFlagsContext`:

```ts shared/src/featureFlagsContext.ts
import { createContext, useContext } from "react";

export interface FeatureFlags {
    featureA: boolean;
    featureB: boolean;
}

export const FeatureFlagsContext = createContext(FeatureFlags | undefined);

export function useFeatureFlags() {
    return useContext(FeatureFlags);
}
```

## Fetch the feature flags remote data

Then, open the host application code and update the `App` component to fetch the feature flags data with the [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md) hook:

```tsx !#7-22,29 host/src/App.tsx
import { AppRouter, usePublicDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FeatureFlagsContext, type FeatureFlags } from "@sample/shared";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([
        {
            queryKey: ["/api/feature-flags"],
            queryFn: async () => {
                const response = await fetch("/api/feature-flags");
                const data = await response.json();

                const flags: FeatureFlags = {
                    featureA: data.featureA,
                    featureB: data.featureB
                };

                return flags;
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

## Setup the deferred registration

Now, let's add a `DeferredRegistrationData` interface to the shared project, specifiying the remote data that module's deferred registration functions can expect:

```ts shared/src/deferredData.ts
import { FeatureFlags } from "./featureFlagsContext.ts";

export interface DeferredRegistrationData {
    featureFlags?: FeatureFlags;
}
```

Then, update the host application `App` component to use the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook. By passing the feature flags data to `useDeferredRegistrations`, this data will be available to the module's deferred registration functions:

```tsx !#27-29,31 host/src/App.tsx
import { AppRouter, usePublicDataQueries, useIsBootstrapping, useDeferredRegistrations } from "@squide/firefly";
import { useMemo } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FeatureFlagsContext, type FeatureFlags, type DeferredRegistrationData } from "@sample/shared";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([
        {
            queryKey: ["/api/feature-flags"],
            queryFn: async () => {
                const response = await fetch("/api/feature-flags");
                const data = await response.json();

                const flags: FeatureFlags = {
                    featureA: data.featureA,
                    featureB: data.featureB
                };

                return flags;
            }
        }
    ]);

    // The useMemo hook is super important otherwise the hook will consider that the feature flags
    // changed everytime the hook is rendered.
    const data: DeferredRegistrationData = useMemo(() => ({ 
        featureFlags 
    }), [featureFlags]);

    useDeferredRegistrations(data);

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

## Register the conditional navigation item

Finally, add `DeferredRegistrationData` to the `ModuleRegisterFunction` type definition and update the module `register` function to defer the registration of the `Page` component navigation item. The `Page` component navigation item will only be registered if `featureB` is active:

```tsx !#5,12-21 src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });

    // Return a deferred registration function.
    return ({ featureFlags }) => {
        // Only register the "Page" navigation items if "featureB" is activated.
        if (featureFlags?.featureB) {
            runtime.registerNavigationItem({
                $id: "page",
                $label: "Page",
                to: "/page"
            });
        }
    };
}
```

!!!tip
A key feature of [TanStack Query](https://tanstack.com/query/latest) is its ability to keep the frontend state synchronized with the server state. To fully leverage this, whenever the data passed to `useDeferredRegistrations` changes, all deferred registration functions are re-executed.

Remember to use [useMemo](https://react.dev/reference/react/useMemo) for your deferred registration data and to specify the `$id` option for your navigation items!
!!!

## Try it :rocket:

Start the application using the `dev` and navigate to the `/page` page. The page should render with the conditonal section. Now, disable the `featureA` flag in the endpoint and refresh the page. You shouldn't see the conditonal section anymore. Finally, disable the `featureB` flag in the endpoint and refresh the page. The menu link labelled "Page" shouldn't be available anymore.

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs (including MSW request handlers) and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
