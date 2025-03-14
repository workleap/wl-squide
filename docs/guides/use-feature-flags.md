---
order: 840
---

# Use feature flags

!!!warning
Before going forward with this guide, make sure that you completed the [Setup Mock Service Worker](./setup-msw.md) and [Fetch global data](./fetch-global-data.md) guides.
!!!

To continuously deliver value to our customers, Workleap has adopted a feature flag system that enables functionalities to be activated or deactivated without requiring a code deployment. While implementing "in-page" feature flags in a Squide application is straightforward, feature flags that conditionally register navigation items require a more advanced [deferred registration](../reference/registration/registerLocalModules.md#defer-the-registration-of-navigation-items) mechanism.

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

Finally, register the request handler using the module registration function:

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

### Create a shared context

Now, in a shared project, create a `FeatureFlagsContext`:

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

!!!info
Ensure that the shared project is configured as a [shared dependency](./add-a-shared-dependency.md).
!!!

## Fetch the feature flags

Finally, open the host application code and update the `App` component to fetch the feature flags data with the [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md) hook:

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

## Conditionally render a page section

Now, let's use the `featureA` flag from `FeatureFlagsContext` to conditionally render a section of a new `Page` component. In this example, a section of the `Page` component will only be rendered if `featureA` is activated:

```tsx remote/src/Page.tsx
import { useFeatureFlags } from "@sample/shared";

export function Page() {
    const { featureFlags } = useFeatureFlags();

    return (
        <>
            {featureFlags?.featureA ? <div>This section is only rendered when "featureA" is activated.</div>}
            <div>Hello from Page!</div>
        </>
    );
}
```

Then, register the `Page` component using the module registration function:

```tsx remote/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "page",
        $label: "Page",
        to: "/page"
    });
}
```

!!!info
If you've already registered a `Page` component in a previous guide, use a different name for this component.
!!!

## Conditionally register a navigation item

Conditionally registering navigation items based on a feature flag is more complex because Squide's default registration mechanism runs before the application has bootstrapped, meaning that the feature flags have not yet been fetched from the server.

To address this, Squide offers an alternate [deferred registration](../reference/registration/registerLocalModules.md#defer-the-registration-of-navigation-items) mechanism in two-phases:

1. The first phase allows modules to register their _static_ navigation items that are not dependent on initial data.

2. The second phase enables modules to register _deferred_ navigation items that are dependent on initial data. We refer to this second phase as **deferred registrations**.

To defer a registration to the second phase, a module's registration function can **return an anonymous function** matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`.

Once the modules are registered and the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook is rendered, the deferred registration functions will be executed with either `"register"` or `"update"` as the value for the `operation` argument, depending on whether this is the initial or subsequent execution of the functions.

First, let's define a `DeferredRegistrationData` interface to a shared project, specifiying the initial data that module's deferred registration functions can expect:

```ts shared/src/deferredData.ts
import { FeatureFlags } from "./featureFlagsContext.ts";

export interface DeferredRegistrationData {
    featureFlags?: FeatureFlags;
}
```

Then, add `DeferredRegistrationData` to the `ModuleRegisterFunction` type definition and update the module `register` function to defer the registration of the `Page` component navigation item:

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

Finally, update the host application's `App` component to use the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook. By passing the feature flags data to `useDeferredRegistrations`, this data will be available to the module's deferred registration functions:

```tsx !#26-28,30 host/src/App.tsx
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

    // The useMemo is super important otherwise the hook will consider that the feature flags
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

!!!info
A key feature of [TanStack Query](https://tanstack.com/query/latest) is its ability to keep the frontend state synchronized with the server state. To fully leverage this, whenever the data passed to `useDeferredRegistrations` changes, all deferred registration functions are re-executed.

Remember to use [useMemo](https://react.dev/reference/react/useMemo) for your deferred registration data and to specify the `$id` option for your navigation items!
!!!

## Try it :rocket:

Start the application using the `dev` and navigate to the `/page` page. The page should render with the conditonal section. Now, disable the `featureA` flag in the endpoint and refresh the page. You shouldn't see the conditonal section anymore. Finally, disable the `featureB` flag in the endpoint and refresh the page. The menu link labelled "Page" shouldn't be available anymore.

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs (including MSW request handlers) and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
