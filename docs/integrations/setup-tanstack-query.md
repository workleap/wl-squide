---
order: 485
label: Setup TanStack Query
---

# Setup TanStack Query

## Setup the query client

To setup TanStack client, refer to the [create an host application](../introduction/create-host.md) guide as a starting point and update the bootstrapping code with a [QueryClientProvider](https://tanstack.com/query/v4/docs/framework/react/reference/QueryClientProvider):

```tsx !#11,17,19
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerHost } from "./register.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost]
});

const queryClient = new QueryClient();

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </FireflyProvider>
);
```

## Setup the development tools

[TanStack Query Devtools](https://tanstack.com/query/v5/docs/framework/react/devtools) provide real-time visibility into how your application manages server state. They make it easier to understand, debug, and optimize data-fetching behavior by exposing the details that normally operate behind the scenes.

We recommend giving the Devtools a try during development.

==- Devtools benefits
- Inspect query states (idle, loading, success, error, stale vs fresh)
- View cached data (what data is cached, when it updates, whether stale-time or cache-time settings work as intended)
- Observe refetching behavior (window refocus, network reconnect, manual invalidation, background updates)
- Monitor query lifecycles
- Debug errors quickly
- Experiment with invalidation and refetching
===

To setup the development tools, first open a terminal at the root of the host application and install the following package:

```bash
pnpm install -D @tanstack/react-query-devtools
```

Then, update the bootstrapping code to add a `ReactQueryDevtools` component:

```tsx !#20
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools  } from "@tanstack/react-query-devtools";
import { registerHost } from "./register.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost]
});

const queryClient = new QueryClient();

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools />
        </QueryClientProvider>
    </FireflyProvider>
);
```

!!!tip
By default, React Query Devtools are only included in bundles when `process.env.NODE_ENV === "development"`, so you don't need to worry about excluding them during a production build.
!!!

## Add a suspense boundary

Refer to the [create an host application](../introduction/create-host.md) guide and update the layout component by adding a [Suspense](https://react.dev/reference/react/Suspense) boundary. This enables the use of the [useSuspenseQuery](https://tanstack.com/query/v5/docs/framework/react/reference/useSuspenseQuery) hook inside pages:

```tsx !#15,17
import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { useNavigationItems, useRenderedNavigationItems } from "@squide/firefly";

export function RootLayout() {
    // Retrieve the navigation items registered by the modules.
    const navigationItems = useNavigationItems();

    // Transform the navigation items into React elements.
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <nav>{navigationElements}</nav>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}
```

## Try it :rocket:

Go through the [fetch page data](../essentials/fetch-page-data.md) essential page steps, then, start the application in a development environment using the `dev` script, then, navigate to the `/page` page. 

You should notice that the character's data is being fetch from the MSW request handler and rendered on the page. Additionally, you should notice that the TanStack Query devtools are available (a ribbon at the bottom right corner).

#### Troubleshoot issues

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs (including MSW request handlers) and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
