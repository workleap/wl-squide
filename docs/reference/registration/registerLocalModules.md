---
toc:
    depth: 2-3
order: 100
---

# registerLocalModules

!!!warning
This function is **deprecated**, use the [bootstrap](../registration/bootstrap.md) function instead.
!!!

Register one or many local module(s). During the registration process, the specified registration function will be invoked with a `FireflyRuntime` instance and an optional `context` object. To **defer the registration** of specific navigation items, a registration function can return an anonymous function.

> A local module is a regular module that is part of the **host application build** and is bundled at build time, as opposed to a [remote module](./registerRemoteModules.md) which is loaded at runtime from a remote server. Local modules are particularly valuable when **launching a new product** with an evolving business domain or when undergoing a **migration** from a monolithic application to a federated application.

## Reference

```ts
registerLocalModules(registerFunctions: [], runtime, options?: { context? })
```

### Parameters

- `registerFunctions`: An array of `ModuleRegisterFunction`.
- `runtime`: A `FireflyRuntime` instance.
- `options`: An optional object literal of options:
    - `context`: An optional context object that will be pass to the registration function.

### Returns

A `Promise` object with an array of `LocalModuleRegistrationError` if any error happens during the registration.

#### `LocalModuleRegistrationError`

- `error`: The original `Error` object.

## Usage

### Register a local module

```tsx !#6 host/src/bootstrap.tsx
import { registerLocalModules, FireflyRuntime } from "@squide/firefly";
import { register } from "@sample/local-module";

const runtime = new FireflyRuntime();

await registerLocalModules([register], runtime);
```

```tsx !#5-8,10-14 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { AboutPage } from "./AboutPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/about",
        element: <AboutPage />
    });

    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        to: "/about"
    });
}
```

### Defer the registration of navigation items

Sometimes, data must be fetched to determine which navigation items should be registered by a given module. To address this, Squide offers a **two-phase registration mechanism**:

1. The first phase allows modules to register their navigation items that are **not dependent on initial data** (in addition to their routes and MSW request handlers when fake endpoints are available).

2. The second phase enables modules to register navigation items that are dependent on initial data. Such a use case would be determining whether a navigation item should be registered based on a feature flag. We refer to this second phase as **deferred registrations**.

To defer a registration to the second phase, a module registration function can **return an anonymous function** matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`.

Once the modules are registered, the deferred registration functions will be executed with the deferred data and `"register"` as the value for the `operation` argument. Afterward, whenever the deferred data changes, the deferred registration functions will be re-executed with the updated deferred data and `"update"` as the value for the `operation` argument.

```tsx !#8 host/src/bootstrap.tsx
import { FireflyRuntime, registerLocalModules, RuntimeContext } from "@squide/firefly";
import { createRoot } from "react";
import { register } from "@sample/local-module";
import { App } from "./App.tsx";

const runtime = new FireflyRuntime();

await registerLocalModules([register], runtime);

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

```tsx !#13-17 host/src/AppRouter.tsx
import { usePublicDataQueries, useDeferredRegistrations, useIsBootstrapping, AppRouter as FireflyAppRouter } from "@squide/firefly";
import { useMemo } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { DeferredRegistrationData } from "@sample/shared";
import { getFeatureFlagsQuery } from "./getFeatureFlagsQuery.ts";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([getFeatureFlagsQuery]);

    // The useMemo is super important otherwise the hook will consider that the feature flags
    // changed everytime the hook is rendered.
    const data: DeferredRegistrationData = useMemo(() => ({ 
        featureFlags 
    }), [featureFlags]);

    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function AppRouter() {
    return (
        <FireflyAppRouter waitForMsw={false} waitForPublicData>
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
        </FireflyAppRouter>
    );
}
```

Routes are always registered, but navigation items can be conditionally registered using a deferred registration function.

```tsx !#21-24,28-37 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";
import { AboutPage } from "./AboutPage.tsx";
import { FeatureAPage } from "./FeatureAPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/about",
        element: <AboutPage />
    });

    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        to: "/about"
    });

    // Routes are always registered. If a route may not be available for a group of users, conditionally register
    // its navigation item with a deferred registration.
    // To manage direct hits to a conditional route, render an error boundary whenever the route's endpoint returns a 401 status code.
    runtime.registerRoute({
        path: "/feature-a",
        element: <FeatureAPage />
    });

    // Once the feature flags has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the feature flags data.
    return ({ featureFlags }) => {
        // Only register the "feature-a" route and navigation item if the feature is active.
        if (featureFlags.featureA) {
            runtime.registerNavigationItem({
                $id: "feature-a",
                $label: "Feature A",
                to: "/feature-a"
            });
        }
    };
}
```

[!ref useDeferredRegistrations](./useDeferredRegistrations.md)

### Use the deferred registration operation argument

```tsx !#28,33 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";
import { AboutPage } from "./AboutPage.tsx";
import { FeatureAPage } from "./FeatureAPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/about",
        element: <AboutPage />
    });

    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        to: "/about"
    });

    // Routes are always registered. If a route may not be available for a group of users, conditionally register
    // its navigation item with a deferred registration.
    // To manage direct hits to a conditional route, render an error boundary whenever the route's endpoint returns a 401 status code.
    runtime.registerRoute({
        path: "/feature-a",
        element: <FeatureAPage />
    });

    // Once the feature flags has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the feature flags data.
    return ({ featureFlags }, operation) => {
        // Only register the "feature-a" route and navigation item if the feature is active.
        if (featureFlags.featureA) {
            runtime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
```

### Handle registration errors

```tsx !#6-8 host/src/bootstrap.tsx
import { registerLocalModules, FireflyRuntime } from "@squide/firefly";
import { register } from "@sample/local-module";

const runtime = new FireflyRuntime();

(await registerLocalModules([register], runtime)).forEach(x => {
    console.error(x);
});
```
