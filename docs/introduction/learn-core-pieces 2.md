---
order: 50
---

# Learn the core pieces 2

## Runtime object

## Modular registration

Squide enables developers to build scalable modular applications with well-defined boundaries by allowing consumers to register dynamic routes, navigation items and MSW request handlers in modules. Each module contributes its own routing configuration, which the host application then assembles into unified structures at bootstrapping. This keeps routing, navigation and request handlers isolated within each module.

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

#### The challenges with global data

At first glance, one might wonder what could be so complicated about fetching the global data of an application. It's only fetches ...right? Well, there are several concerns to take into account for a modular application:

- When in development, the global data cannot be fetched until the Mock Service Worker (MSW) **request handlers** are **registered** and **MSW is ready**.
- To register the MSW request handlers, the **modules** must be **registered** first.
- If the requested page is _public_, only the global public data should be fetched.
- If the requested page is _protected_, **both** the global **public** and **protected data** should be **fetched**.
- The requested page rendering must be delayed until the global data has been fetched.
- A **unique loading spinner** should be displayed to the user during this process, ensuring there's **no flickering** due to different spinners being rendered.

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
```ts
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    environmentVariables: {
        "apiBaseUrl", "https://my-api.com",
        "telemetryBaseUrl", "https://my-telemetry.com"
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

<!-- ## Feature flags -->

## Honeycomb



## Plugins

## Integrations



## Reference

For an exhaustive list of the Squide API, refer to the [reference](../reference/default.md) section.

## Samples

Finally, have a look at the [sample applications](../samples.md) to see the Squide API in action.
