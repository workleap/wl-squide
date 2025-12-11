---
order: 40
label: Learn the core pieces
---

# Learn the core pieces

Now that we've created a host application, loaded a few modules, registered routes and navigation items, and learn the modular design principles, let's delve into the core pieces provided by Squide.

## Runtime

The [runtime instance](../reference/runtime/FireflyRuntime.md) serves as the backbone of a Squide application, enabling modularity and maintaining a decoupled and extendable system. It's purpose is to configure and manage the environment of the application, register the modules and plugins, and centralize cross-cutting concerns such as messaging, logging, telemetry/observability, environment variables and feature flags.

#### Learn more

- [Reference documentation](../reference/runtime/FireflyRuntime.md)

## Modular registration

Squide enables developers to build scalable modular applications with well-defined boundaries by allowing consumers to register dynamic routes, navigation items and MSW request handlers in modules. Each module contributes its own routing configuration, which the host application then assembles into unified structures at bootstrapping. This keeps routing, navigation and request handlers isolated within each module.

==- :icon-light-bulb: The drawbacks of a tightly coupled architecture
The opposite of a modular architecture is a tightly coupled architecture. This style of architecture often evolves into what is commonly described as a **"big ball of mud"**. As the codebase grows, teams face increasing maintenance difficulties, scaling limitations, and unpredictable side effects.

Systems with highly coupled architectures are typically characterized by:

- Unclear internal structure
- Weak boundaries
- High coupling
- Low cohesion
- Inconsistent design decisions

While such an architecture seems appropriate during the first weeks or months of a project, problems emerge quickly as the system grows:

- **Harder to understand:** The codebase lacks boundaries and consistent patterns, making it difficult for developers to build a clear mental model. Logic becomes scattered across unrelated areas of the system.
- **Higher cost of change and risk of regressions:** Modifying one part of the system often produces unexpected side effects elsewhere. The tight coupling increases the likelihood of regressions.
- **Slower onboarding:** New developers take longer to understand the system due to the absence of clear boundaries and scattered logic.
- **Increased coordination needs:** As more teams contribute to the same codebase, they frequently touch overlapping areas. This requires cross-team synchronization and generates coordination overhead.
- **Slower releases:** Testing and releasing new features require validating the entire system, extending release cycles.
- **Unclear ownership:** Without well-defined boundaries, ownership becomes ambiguous. This slows decision-making and complicates maintenance responsibilities.
- **Growing accidental complexity:** Temporary workarounds accumulate rather than being replaced by proper abstractions, causing technical debt to rise quickly.
===

==- :icon-file-code: Code sample
```tsx !#5-8,10-14,16-22
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx"

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "page-1",
        $label: "Page 1",
        to: "/page-1"
    });

    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW code in production bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
};
```
===

#### Learn more

- [Register routes](../essentials/register-routes.md)
- [Register navigation items](../essentials/register-nav-items.md)
- [Register deferred navigation items](../essentials/register-deferred-nav-items.md)
- [Register MSW request handlers](../essentials/register-msw-handlers.md)
- [Setup MSW](../integrations/setup-msw.md)

## Deferred registrations

Modules can delay registering navigation items until global data or feature flags are available by returning a registration function. That function is re-executed whenever global data or feature flags change, keeping the registrations up to date.

==- :icon-file-code: Code sample
```tsx !#18-26
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx"

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page-1",
        element: <Page />
    });

    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW code in production bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }

    return (deferredRuntime, { userData }) => {
        if (userData.isAdmin && deferredRuntime.getFeatureFlag("enable-page-1")) {
            runtime.registerNavigationItem({
                $id: "page-1",
                $label: "Page 1",
                to: "/page-1"
            });
        }
    };
};
```
===

#### Learn more

- [Register deferred navigation items](../essentials/register-deferred-nav-items.md)

## Public and protected pages

Modules can declare routes which are meant to be [publicly accessible](../essentials/register-routes.md#register-a-public-route) or that are protected (requires an authentication). Squide built-in primitives handles the bootstrapping orchestration to:

- Fetch only the [public global data](../essentials/fetch-public-global-data.md) if the requested page is registered as "public".
- Fetch only the [protected global data](../essentials/fetch-protected-global-data.md) if the requested page is registered as "protected".

==- :icon-file-code: Code sample
```tsx !#6-9,11-14
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { PublicPage } from "./PublicPage.tsx"
import { ProtectedPage } from "./ProtectedPage.tsx"

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerPublicRoute({
        path: "/public",
        element: <PublicPage />
    });

    runtime.registerRoute({
        path: "/protected",
        element: <ProtectedPage />
    });
};
```
===

#### Learn more

- [Register a public route](../essentials/register-routes.md#register-a-public-route)
- [Setup Tanstack Query](../integrations/setup-tanstack-query.md)
- [Fetch public global data](../essentials/fetch-public-global-data.md)
- [Fetch protected global data](../essentials/fetch-protected-global-data.md)

## Global data fetching

Squide makes global protected data fetching easier, by providing primitives build on top of [Tanstack Query](https://tanstack.com/query) to orchestrate both the data-loading states and the associated UI.

==- :icon-light-bulb: The challenges with global data
At first glance, one might wonder what could be so complicated about fetching the global data of an application. It's only fetches ...right? Well, there are several concerns to take into account for a modular application:

- When in development, the global data cannot be fetched until the Mock Service Worker (MSW) **request handlers** are **registered** and **MSW is ready**.
- To register the MSW request handlers, the **modules** must be **registered** first.
- If the requested page is _public_, only the global public data should be fetched.
- If the requested page is _protected_, **both** the global **public** and **protected data** should be **fetched**.
- The requested page rendering must be delayed until the global data has been fetched.
- A **unique loading spinner** should be displayed to the user during this process, ensuring there's **no flickering** due to different spinners being rendered.
===

==- :icon-file-code: Code sample
```tsx !#6-13,15-22
import { usePublicDataQueries, useProtectedDataQueries, useIsBootstrapping } from "@squide/firefly";
import { Outlet } from "react-router";
import { FetchCountContext, SubscriptionContext, isApiError } from "@sample/shared";

function BootstrappingRoute() {
    const [fetchCount] = usePublicDataQueries([
        {
            queryKey: ["/api/count"],
            queryFn: async () => {
                // ...
            }
        }
    ]);

    const [subscription] = useProtectedDataQueries([
        {
            queryKey: ["/api/subscription"],
            queryFn: async () => {
                // ...
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
```
===

#### Learn more

- [Setup Tanstack Query](../integrations/setup-tanstack-query.md)
- [Fetch public global data](../essentials/fetch-public-global-data.md)
- [Fetch protected global data](../essentials/fetch-protected-global-data.md)

## Messaging

Squide event bus offers a [pub/sub](https://medium.com/@ignatovich.dm/implementing-the-pub-sub-pattern-in-javascript-a-guide-for-beginners-44714a76d8c7) mechanism for modules to communicate through events without creating tight coupling.

==- :icon-file-code: Code sample
```ts !#9
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleFoo = useCallback((data, context) => {
    // Do something...
}, []);

// Listen to the first "foo" event.
useEventBusListener("foo", handleFoo, { once: true };
```

```ts !#3,6
import { useEventBusDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

// Dispatch a "foo" event with a "bar" payload.
dispatch("foo", "bar");
```
===

#### Learn more

- [Use the event bus](../essentials/use-event-bus.md)

## Logging

Squide logger provides visibility into the application's bootstrapping flow and how modules behave and interact. It also offers an abstraction that allows applications to emit custom logs to multiple destinations defined by the host application.

==- :icon-file-code: Code sample
```ts !#3,5
import { useLogger } from "@squide/firefly";

const logger = useLogger();

logger.debug("Hello!");
```
===

#### Learn more

- [Setup the logger](../integrations/setup-logger.md)
- [Use the logger](../essentials/use-logger.md)

## Environment variables

Squide attaches environment variables to a [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance rather than accessing `process.env` throughout the codebase. This strategy supports a modular architecture and makes it easier to write tests and Storybook stories by isolating configuration from global state and making environment variables independent from build-time specifics.

==- :icon-file-code: Code sample
```ts !#4-7
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    environmentVariables: {
        apiBaseUrl: "https://my-api.com",
        telemetryBaseUrl: "https://my-telemetry.com"
    }
});
```

```ts !#3
import { useEnvironmentVariable } from "@squide/firefly";

const variable = useEnvironmentVariable("apiBaseUrl");
```
===

#### Learn more

- [Use environment variables](../essentials/use-env-variables.md)

## Feature flags

Squide integrates with [LaunchDarkly](https://launchdarkly.com/) to attach feature flags to the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance and automatically update [deferred registrations](../essentials/register-deferred-nav-items.md) whenever a flag value changes.

==- :icon-file-code: Code sample
```ts !#18
import { initializeFirefly } from "@squide/firefly";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";

const launchDarklyClient = initializeLaunchDarkly("123", {
    kind: "user",
    anonymous: true
}, {
    stream: true
});

try {
    await launchDarklyClient.waitForInitialization(5);
} catch (error: unknown) {
    // Failed to initialize LaunchDarkly...
}

const runtime = initializeFirefly({
    launchDarklyClient
});
```

```ts !#3
import { useFeatureFlag } from "@squide/firefly";

const value = useFeatureFlag("show-characters", true);
```
===

#### Learn more

- [Setup LaunchDarkly](../integrations/setup-launch-darkly.md)
- [Use feature flags](../essentials/use-feature-flags.md)

## Honeycomb

Squide integrates with [@workleap/telemetry](https://www.npmjs.com/package/@workleap/telemetry) v2 or later (or [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) v7 or later) to automatically send performance traces for the bootstrapping flow of an application.

==- :icon-file-code: Code sample
```tsx !#6-15,18
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { initializeTelemetry } from "@workleap/telemetry/react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const telemetryClient = initializeTelemetry({
    honeycomb: {
        namespace: "sample",
        serviceName: "squide-sample",
        apiServiceUrls: [/.+/g,],
        options: {
            proxy: "https://my-proxy.com"
        }
    }
});

const runtime = initializeFirefly({
    honeycombInstrumentationClient: telemetryClient.honeycomb
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```
===

#### Learn more

- [Setup Honeycomb](../integrations/setup-honeycomb.md)
- [Set Honeycomb custom attributes](../essentials/set-honeycomb-custom-attributes.md)

## Plugins

To keep Squide lightweight, not all functionalities should be integrated as a core functionality. However, to accommodate a broad range of technologies, a [plugin system](../reference/plugins/Plugin.md) has been implemented to fill the gap.

#### Learn more

==- :icon-file-code: Code sample
```ts !#5
import { initializeFirefly } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```
===

- [Register plugins](../essentials/register-plugins.md)

## Integrations

To finish setting up Squide, continue with the [integration](../integrations/index.md) guides.

## Reference

For an exhaustive list of the Squide API, refer to the [reference](../reference/default.md) section.

## Samples

Finally, have a look at the [sample applications](../samples.md) to see the Squide API in action.
