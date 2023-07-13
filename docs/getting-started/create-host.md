---
order: 100
label: Create an host app
---

# Create an host application

Let's begin by creating the application that will serve as the entry point for our federated application and host the application modules.

## Install the packages

Create a new project (we'll refer to ours as `host`), then open a terminal at the root of the newly created project and install the following packages:

+++ pnpm
```bash
pnpm add @squide/core @squide/react-router @squide/webpack-module-federation webpack react-router-dom
```
+++ yarn
```bash
yarn add @squide/core @squide/react-router @squide/webpack-module-federation webpack react-router-dom
```
+++ npm
```bash
npm install @squide/core @squide/react-router @squide/webpack-module-federation webpack react-router-dom
```
+++

## Setup the application

First, create the following files:

```
host
├── src
├──── App.tsx
├──── RootLayout.tsx
├──── Home.tsx
├──── bootstrap.tsx
├──── index.ts
├── webpack.config.js
```

Then, use a dynamic import to add an async boundary:

```ts host/src/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore doesn't support file extension.
import("./bootstrap");

// TS1208: 'index.tsx' cannot be compiled under '--isolatedModules' because it is considered a global script file. Add an import, export, or an
// empty 'export {}' statement to make it a module.
export {};
```

!!!info
To learn more about this async boundary and the `bootstrap.tsx` file, read the following [article](https://dev.to/infoxicator/module-federation-shared-api-ach#using-an-async-boundary).
!!!

Then, instanciate the shell [Runtime](/references/runtime/runtime-class.md) and [register the remote module](/references/registration/registerRemoteModules.md) (the configuration of the remote module will be covered in the [next section](create-remote-module.md)):

```tsx !#23,13-15,18-20 host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { ConsoleLogger, RuntimeContext, Runtime } from "@squide/react-router";
import { registerRemoteModules, type RemoteDefinition } from "@squide/webpack-module-federation";
import type { AppContext} from "@sample/shared";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { url: "http://localhost:8081", name: "remote1" }
];

// Create the shell runtime.
const runtime = new Runtime({
    loggers: [new ConsoleLogger()]
});

// Create an optional context.
const context: AppContext = {
    name: "Demo application"
};

// Register the remote module.
registerRemoteModules(Remotes, runtime, context);

const root = createRoot(document.getElementById("root"));

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

Then, [retrieve the routes](/references/runtime/useRoutes.md) that have been registered by the remote module and create a router instance:

```tsx !#10,13,17 host/src/App.tsx
import { lazy, useMemo } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useRoutes } from "@squide/react-router";
import { useAreRemotesReady } from "@squide/webpack-module-federation";
import { RootLayout } from "./RootLayout.tsx";
import { Home } from "./Home.tsx";

export function App() {
    // Re-render the application once the remote modules are registered.
    const isReady = useAreRemotesReady();

    // Retrieve the routes registered by the remote modules.
    const routes = useRoutes(runtime);

    // Create the router instance with an home page and the remote module routes.
    const router = useMemo(() => {
        return createBrowserRouter([
            {
                path: "/",
                element: <RootLayout />,
                children: [
                    {
                        index: true,
                        element: <Home />
                    },
                    ...routes
                ]
            }
        ]);
    }, [routes]);

    // Display a loading until the remote modules are registered.
    if (!isReady) {
        return <Loading />;
    }

    // Render the router.
    return (
        <RouterProvider
            router={router}
            fallbackElement={<Loading />}
        />
    );
}
```

```tsx host/src/Home.tsx
export function Home() {
    return (
        <div>Hello from the Home page!</div>
    )
}
```

Then, create a layout component to [render the navigation items](/references/routing/useRenderedNavigationItems.md):

```tsx !#38,41 host/src/RootLayout.tsx
import type { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/react-router";

const renderItem: RenderItemFunction = (item, index, level) => {
    // To keep thing simple, this sample doesn't support nested navigation items.
    // For an example including support for nested navigation items, have a look at
    // https://workleap.github.io/wl-squide/references/routing/userenderednavigationitems/
    if (!isNavigationLink(item)) {
        return null;
    }

    return (
        <li key={`${level}-${index}`}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, index, level) => {
    return (
        <ul key={`${level}-${index}`}>
            {elements}
        </ul>
    );
};

export default function RootLayout() {
    // Retrieve the navigation items registered by the remote modules.
    const navigationItems = useNavigationItems();

    // Transform the navigation items into React elements.
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <nav>{navigationElements}</nav>
            <Outlet />
        </>
    );
}
```

## Configure Webpack

To include the Webpack [ModuleFederationPlugin](https://webpack.js.org/plugins/module-federation-plugin/) we'll use the [hostTransformer](/references/webpack/hostTransformer.md) function:


```js !#8 host/webpack.config.js
import { hostTransformer } from "@squide/webpack-module-federation/configTransformer.js";

/** @type {import("webpack").Configuration} */
const webpackConfig = {
    ...
};

const federatedConfig = hostTransformer(config, "host");

export default federatedConfig;
```

[!ref icon="mark-github" text="View a full webpack.config.js"](https://github.com/gsoft-inc/wl-squide/blob/main/sample/host/webpack.dev.js)

## Try the application :rocket:

Start the application, and you should see the home page. Even if the remote module application is not yet available, the host application will gracefully load.
