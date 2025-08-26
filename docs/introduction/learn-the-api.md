---
order: 50
---

# Learn the API

Now that we've created a host application, loaded a few modules and registered routes and navigation items, let's delve into the APIs provided by this shell.

## Runtime mode

In an effort to optimize the development experience, Squide can be bootstrapped in `development` or `production` mode:

```ts !#4 host/src/index.tsx
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    mode: "production"
});
```

By default, the runtime [mode](../reference/runtime/runtime-class.md#change-the-runtime-mode) is `development`.

## Logging

Squide integrates with the [@workleap/logging](https://workleap.github.io/wl-logging/introduction/getting-started/) library by accepting an optional array of loggers and making them available anywhere in the application through the [useLogger](../reference/runtime/useLogger.md) hook.

First, install the `@workleap/logging` package and register a logger:

```ts !#5 host/src/index.tsx
import { initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";

const runtime = initializeFirefly({
    loggers: [new BrowserConsoleLogger()]
});
```

Then, log entries from any parts of your modular application with the [useLogger](../reference/runtime/useLogger.md) hook:

```ts !#3,5
import { useLogger } from "@squide/firefly";

const logger = useLogger();

logger.debug("Hello!");
```

The logger is also available from the [FireflyRuntime](../reference/runtime/runtime-class.md#log-a-message) instance.

## Messaging

It's crucial that the parts of a modular application remains loosely coupled. To help with that, Squide offers a built-in [Event Bus](../reference/messaging/EventBus.md).

First, listen to an event with the [useEventBusListener](../reference/messaging/useEventBusListener.md) hook:

```ts !#8
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleFoo = useCallback((data, context) => {
    // do something...
}, []);

useEventBusListener("foo", handleFoo);
```

Then, dispatch an event from anywhere with the [useEventBusDispatcher](../reference/messaging/useEventBusDispatcher.md) hook:

```ts !#3,5
import { useEventDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

dispatch("foo", "bar");
```

You can use the event bus to enable various communication scenarios, such as notifying components of state changes, broadcasting messages across modules, or triggering actions based on specific events.

The event bus is also available from the [FireflyRuntime](../reference/runtime/runtime-class.md#use-the-event-bus) instance.

## Plugins

To keep Squide lightweight, not all functionalities should be integrated as a core functionality. However, to accommodate a broad range of technologies, a [plugin system](../reference/plugins/plugin.md) has been implemented to fill the gap.

Plugins can be registered at bootstrapping with the [FireflyRuntime](../reference/runtime/runtime-class.md) instance:

```ts !#5 host/src/boostrap.tsx
import { initializeFirefly } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

And can be accessed from any parts of the application with the `usePlugin` hook:

```ts !#4
import { usePlugin } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = usePlugin(MyPlugin.name) as MyPlugin;
```

A plugin can also be retrieved from the [FireflyRuntime](../reference/runtime/runtime-class.md#retrieve-a-plugin) instance.

> By default, the `FireflyRuntime` registers Squide's [MSW plugin](../guides/setup-msw.md). An optional [i18next plugin](../guides/setup-i18next.md) is available.

## TanStack Query

Hooks are available to retrieve global application data using [TanStack Query](https://tanstack.com/query/latest). To fetch public data, use the [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md) hook:

```tsx !#3-10
import { usePublicDataQueries } from "@squide/firefly";

const [featureFlags] = usePublicDataQueries([{
    queryKey: ["/api/feature-flags"],
    queryFn: async () => {
        const response = await fetch("/api/feature-flags");

        return response.json();
    }
}]);
```

To retrieve protected data, use the [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hook instead:

```tsx !#4-21
import { useProtectedDataQueries } from "@squide/firefly";
import { ApiError } from "@sample/shared";

const [session, subscription] = useProtectedDataQueries([
    {
        queryKey: ["/api/session"],
        queryFn: async () => {
            const response = await fetch("/api/session");

            return response.json();
        }
    },
    {
        queryKey: ["/api/subscription"],
        queryFn: async () => {
            const response = await fetch("/api/subscription");

            await response.json();
        }
    }
], error => isApiError(error) && error.status === 401);
```

If an unmanaged error occur while retrieving the data, a [GlobalDataQueriesError](../reference/tanstack-query/isGlobalDataQueriesError.md) is thrown.

## Fakes

Take a look at the [fake implementations](../reference/default.md#fakes). These implementations are designed to facilitate the set up of a module isolated environment.

## Guides

Explore the [guides](../guides/default.md) section to learn about Squide advanced features.

Be sure to read, at a minimum, the following guides:

- [Setup Mock Service Worker](../guides/setup-msw.md)
- [Fetch global data](../guides/fetch-global-data.md)
- [Fetch page data](../guides/fetch-page-data.md)
- [Manage shared state](../guides/manage-shared-state.md)
- [Isolate module failures](../guides/isolate-module-failures.md)
- [Add authentication](../guides/add-authentication.md)

If your application is a [Module Federation](https://module-federation.io/) application, be sure to also check out the following guides:

- [Starting guide for Module Federation applications](../module-federation/create-host.md)
- [Add a shared dependency](../module-federation/add-a-shared-dependency.md)

## Reference

For a comprehensive list of the Squide API, refer to the [reference](../reference/default.md) section.

## Samples

Finally, have a look at the [sample applications](../samples.md) to see the Squide API in action.
