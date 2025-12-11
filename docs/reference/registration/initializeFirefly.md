---
order: 150
toc:
    depth: 2-3
---

# initializeFirefly

Create a [Runtime](../runtime/FireflyRuntime.md) instance, register local modules and optionally start [MSW](https://mswjs.io/). During the registration process, the modules' registration function will be invoked with a [FireflyRuntime](../runtime/FireflyRuntime.md) instance and an optional `context` object. To [defer the registration](#defer-the-registration-of-navigation-items) of specific navigation items, a registration function can return an anonymous function.

## Reference

```ts
const runtime = initializeFirefly(options?: { 
    mode?,
    localModules?,
    context?,
    useMsw?,
    startMsw?,
    environmentVariables?,
    honeycombInstrumentationClient?,
    launchDarklyClient?,
    loggers?,
    plugins?,
    onError?
})
```

### Parameters

- `options`: An optional object literal of options:
    - `mode`: An optional mode to optimize Squide for production. Values are `"development"` (default) and `"production"`.
    - `localModules`: An optional array of `ModuleRegisterFunction`.
    - `context`: An optional context object that will be pass to the registration function.
    - `useMsw`: An optional `boolean` value indicating whether or not to create the runtime with [Mock Service Work](https://mswjs.io/) (MSW) support.
    - `startMsw`: An optional function to register MSW request handlers and start MSW service. This function is required if [MSW is enabled](#use-msw).
    - `environmentVariables`: An optional object of environment variables.
    - `honeycombInstrumentationClient`: An optional Honeycomb instrumentation client for tracing the Squide bootstrapping flow.
    - `launchDarklyClient`: An optional LaunchDarkly client for enabling feature flags.
    - `loggers`: An optional array of logger instances.
    - `plugins`: An optional array of `Plugin` factory functions.
    - `onError`: An optional function that is called whenever a bootstrapping error occurs.

### Returns

A [FireflyRuntime](../runtime/FireflyRuntime.md) instance.

## Usage

### Change the runtime mode

```ts !#4
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    mode: "production"
});
```

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

### Provide environment variables

```ts !#4-7
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    environmentVariables: {
        "foo": "bar",
        "john": "doe"
    }
});
```

### Provide an Honeycomb instrumentation client

```ts !#13
import { initializeFirefly } from "@squide/firefly";
import { initializeTelemetry } from "@workleap/telemetry/react";

const telemetryClient = initializeTelemetry({
    serviceName: "sample",
    apiServiceUrls: [/http:\/\/localhost\.*/],
    options: {
        apiKey: "123"
    }
});

const runtime = initializeFirefly({
    honeycombInstrumentationClient: telemetryClient.honeycomb
});
```

### Provide a LaunchDarkly client

Before creating the plugin instance, initialize the LaunchDarkly client with [streaming](https://launchdarkly.github.io/js-client-sdk/interfaces/LDOptions.html#streaming) enabled, then wait until the [client is ready](https://launchdarkly.com/docs/sdk/client-side/javascript#determine-when-the-client-is-ready).

```ts !#17
import { initializeFirefly, LaunchDarklyPlugin } from "@squide/firefly";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";

const launchDarklyClient = initializeLaunchDarkly("123", {
    kind: "user",
    anonymous: true
}, {
    // It's important to use the stream mode to receive feature flags
    // updates in real time.
    streaming: true
});

// Always initialize the client before forwarding the instance to the "initializeFirefly" function.
await launchDarklyClient.waitForInitialization(5);

const rumtime = initializeFirefly({
    launchDarklyClient
});
```

### Register a logger

The logger intance receives the `Runtime` instance as parameter.

```ts !#5
import { initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";

const runtime = initializeFirefly({
    loggers: [new BrowserConsoleLogger()]
});
```

### Defer the registration of navigation items

Sometimes, data must be fetched to determine which navigation items should be registered by a given module. To address this, Squide offers a **two-phase registration mechanism**:

1. The first phase allows modules to register their navigation items that are **not dependent** on initial data or feature flags (in addition to their routes and MSW request handlers when fake endpoints are available).
2. The second phase enables modules to register navigation items that are dependent on initial data and/or feature flags. Such a use case would be determining whether a navigation item should be registered based on a user profile or a flag. We refer to this second phase as **deferred registrations**.

To defer a registration to the second phase, a module registration function can **return an anonymous function** matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`.

Once the modules are registered, the deferred registration functions will be executed with the optional deferred data and `"register"` as the value for the `operation` argument. Afterward, whenever the deferred data and/or the feature flags changes, the deferred registration functions will be re-executed with the updated deferred data and `"update"` as the value for the `operation` argument.

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

```tsx !#13-15,19 host/src/App.tsx
import { usePublicDataQueries, useDeferredRegistrations, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { useMemo } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { DeferredRegistrationData } from "@sample/shared";
import { getUserInfoQuery } from "./getUserInfoQuery.ts";

function BootstrappingRoute() {
    const [userInfo] = usePublicDataQueries([getUserInfoQuery]);

    // The useMemo is super important otherwise the hook will consider that the user info
    // object changed everytime the hook is rendered.
    const data: DeferredRegistrationData = useMemo(() => ({ 
        userInfo 
    }), [userInfo]);

    // The data object is optional. If the modules deferred registrations only depends on
    // feature flags, do not forward any data.
    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
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

Routes are always registered, but navigation items can be conditionally registered using a deferred registration function.

```tsx !#21-24,28-38 local-module/src/register.tsx
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

    // Once the user info has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the user data.
    return (deferredRuntime, { userInfo }) => {
        // Only register the "feature-a" route and navigation item if the user is an administrator
        // and the "feature-a" flag is activated.
        if (userInfo.isAdmin && deferredRuntime.getFeatureFlag("enable-feature-a", true)) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: "Feature A",
                to: "/feature-a"
            });
        }
    };
}
```

```tsx !#20-23,27-37 remote-module/src/register.tsx
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

    // Once the user info has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the user data.
    return (deferredRuntime, { userInfo }) => {
        // Only register the "feature-b route and navigation item if the user is a manager
        // and the "feature-b" flag is activated.
        if (featureFlags.isManager && deferredRuntime.getFeatureFlag("enable-feature-b")) {
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

```tsx !#28,34 local-module/src/register.tsx
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

    // Once the user info has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the user data.
    return (deferredRuntime, { userInfo }, operation) => {
        // Only register the "feature-a" route and navigation item if the user is an administrator
        // and the "feature-a" flag is activated.
        if (userInfo.isAdmin  && deferredRuntime.getFeatureFlag("enable-feature-a", true)) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
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

[!ref Learn more about plugins](../plugins/Plugin.md)
