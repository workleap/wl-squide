---
order: 150
toc:
    depth: 2-3
---

# initializeFirefly

Create a [Runtime](../runtime/runtime-class.md) instance, register **local** or **remote** modules and optionally start [MSW](https://mswjs.io/). During the registration process, the modules' registration function will be invoked with a [FireflyRuntime](../runtime/runtime-class.md) instance and an optional `context` object. To **defer the registration** of specific navigation items, a registration function can return an anonymous function.

> A local module is a regular module that is part of the **host application build** and is bundled at build time, as opposed to a remote module which is loaded at runtime from a remote server.

> A remote module is a module that is not part of the current build but is **loaded at runtime** from a remote server.

## Reference

```ts
const runtime = initializeFirefly(options?: { localModules?, remotes?, startMsw?, onError?, context?, mode?, useMsw?, loggers?, plugins? })
```

### Parameters

- `options`: An optional object literal of options:
    - `localModules`: An optional array of `ModuleRegisterFunction`.
    - `remotes`: An optional array of [RemoteDefinition](#remote-definition).
    - `startMsw`: An optional function to register MSW request handlers and start MSW service. This function is required if [MSW is enabled](../runtime/runtime-class.md#use-mock-service-worker).
    - `onError`: An optional function that is called whenever a bootstrapping error occurs.
    - `context`: An optional context object that will be pass to the registration function.
    - `mode`: An optional mode to optimize Squide for production. Values are `"development"` (default) and `"production"`.
    - `useMsw`: An optional `boolean` value indicating whether or not to create the runtime with [Mock Service Work](https://mswjs.io/) (MSW) support.
    - `loggers`: An optional array of logger instances.
    - `plugins`: An optional array of `Plugin` factory functions.

### Returns

A [FireflyRuntime](../runtime/runtime-class.md) instance.

## Usage

### Register a local module

```tsx !#5 host/src/index.tsx
import { initializeFirefly } from "@squide/firefly";
import { register } from "@sample/local-module";

const runtime = initializeFirefly({
    localModules: [register]
});
```

```tsx !#5-8,10-14 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/local/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "local-page",
        $label: "Local/Page",
        to: "/local/page"
    });
}
```

### Register a remote module

```tsx !#5-7,10 host/src/bootstrap.tsx
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { createRoot } from "react";
import { App } from "./App.tsx";

const Remotes: RemoteDefinition = [
    { name: "remote1" }
];

const runtime = initializeFirefly({
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

```tsx !#5-8,10-14 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/remote/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "remote-page",
        $label: "Remote/Page",
        to: "/remote/page"
    });
}
```

### Use MSW

```tsx !#7,9-13 host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register } from "@sample/local-module";
import { createRoot } from "react";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    useMsw: true,
    localModules: [register],
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("./mocks/browser.ts")).startMsw(runtime.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Handle registration errors

```tsx !#8-10 host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register } from "@sample/local-module";
import { createRoot } from "react";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [register],
    onError: error => {
        console.log(error);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Provide a registration context

```tsx #8-9 host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register } from "@sample/local-module";
import { createRoot } from "react";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [register],
    // Can be anything.
    context: { foo: "bar" }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Change the runtime mode

```ts !#4
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    mode: "production"
});
```

### Register a logger

The logger intance receives the `Runtime` instance as parameter.

```ts !#5
import { ConsoleLogger, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";

const runtime = initializeFirefly({
    loggers: [new BrowserConsoleLogger()]
});
```

### Register a plugin

The plugin factory function receives the `Runtime` instance as parameter.

```ts !#5
import { initializeFirefly } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

[!ref Learn more about plugins](../plugins/plugin.md)

### Defer the registration of navigation items

Sometimes, data must be fetched to determine which navigation items should be registered by a given module. To address this, Squide offers a **two-phase registration mechanism**:

1. The first phase allows modules to register their navigation items that are **not dependent on initial data** (in addition to their routes and MSW request handlers when fake endpoints are available).

2. The second phase enables modules to register navigation items that are dependent on initial data. Such a use case would be determining whether a navigation item should be registered based on a feature flag. We refer to this second phase as **deferred registrations**.

To defer a registration to the second phase, a module registration function can **return an anonymous function** matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`.

Once the modules are registered, the deferred registration functions will be executed with the deferred data and `"register"` as the value for the `operation` argument. Afterward, whenever the deferred data changes, the deferred registration functions will be re-executed with the updated deferred data and `"update"` as the value for the `operation` argument.

```tsx host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register } from "@sample/local-module";
import { createRoot } from "react";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [register]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

```tsx !#11-17 host/src/AppRouter.tsx
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
        <FireflyAppRouter waitForPublicData>
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
import { Page } from "./Page.tsx";
import { FeatureAPage } from "./FeatureAPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/local/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "/local/page",
        $label: "Local/Page",
        to: "/local/page"
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
    return (deferredRuntime, { featureFlags }) => {
        // Only register the "feature-a" route and navigation item if the feature is active.
        if (featureFlags.featureA) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: "Feature A",
                to: "/feature-a"
            });
        }
    };
}
```

```tsx !#20-23,27-36 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";
import { FeatureBPage } from "./FeatureBPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/remote/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "remote-page",
        $label: "Remote/Page",
        to: "/remote/page"
    });

    // Routes are always registered. If a route may not be available for a group of users, conditionally register
    // its navigation item with a deferred registration.
    // To manage direct hits to a conditional route, render an error boundary whenever the route's endpoint returns a 401 status code.
    runtime.registerRoute({
        path: "/feature-b",
        element: <FeatureBPage />
    });

    // Once the feature flags has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the feature flags data.
    return (deferredRuntime, { featureFlags }) => {
        // Only register the "feature-b route and navigation item if the feature is active.
        if (featureFlags.featureB) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-b",
                $label: "Feature B",
                to: "/feature-b"
            });
        }
    };
}
```

!!!warning
It's important to register conditional navigation items using the `deferredRuntime` argument rather than the root `runtime` argument.
!!!

[!ref useDeferredRegistrations](./useDeferredRegistrations.md)

### Use the deferred registration operation argument

```tsx !#28,33 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";
import { Page } from "./Page.tsx";
import { FeatureAPage } from "./FeatureAPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/local/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "local/page",
        $label: "Local/Page",
        to: "/local/page"
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
    return (deferredRuntime, { featureFlags }, operation) => {
        // Only register the "feature-a" route and navigation item if the feature is active.
        if (featureFlags.featureA) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
```

## Remote definition

To ease the configuration of remote modules, make sure that you first import the `RemoteDefinition` type and assign it to your remote definitions array declaration.

```ts !#3 host/src/bootstrap.tsx
import type { RemoteDefinition } from "@squide/firefly";

const Remotes: RemoteDefinition = [
    { name: "remote1" }
];
```

### `name`

The `name` option of a remote definition **must match** the `name` option defined in the remote module [ModuleFederationPlugin](https://module-federation.io/configure/index.html) configuration.

If you are using either the Squide [defineDevRemoteModuleConfig](../webpack/defineDevRemoteModuleConfig.md) or [defineBuildRemoteModuleConfig](../webpack/defineBuildRemoteModuleConfig.md) functions to add the `ModuleFederationPlugin` to the remote module webpack [configuration object](https://module-federation.io/), then the remote module `name` is the second argument of the function.

In the following exemple, the remote module `name` is `remote1`.

```ts !#2 host/src/bootstrap.tsx
const Remotes: RemoteDefinition = [
    { name: "remote1" }
];
```

```js !#6 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
```
