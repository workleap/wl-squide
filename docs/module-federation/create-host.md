---
order: 210
label: Create an host application
---

# Create an host application

!!!info Use an existing template

We highly recommend going through the entire getting started guide. However, if you prefer to scaffold the application we'll be building, a template is available with [degit](https://github.com/Rich-Harris/degit):

```bash
corepack pnpm dlx degit https://github.com/workleap/wl-squide/templates/getting-started-remote
```
!!!

Let's begin by creating the application that will serve as the entry point for our federated application and host the application modules.

## Install the packages

Create a new application (we'll refer to ours as `host`), then open a terminal at the root of the new solution and install the following packages:

```bash
pnpm add -D @workleap/swc-configs @workleap/browserslist-config @squide/firefly-webpack-configs webpack webpack-dev-server webpack-cli @swc/core @swc/helpers browserslist postcss typescript @types/react @types/react-dom
pnpm add @squide/firefly @squide/firefly-module-federation react react-dom react-router msw @tanstack/react-query
```

## Setup the application

First, create the following files:

```
host
├── public
├──── index.html
├── src
├──── App.tsx
├──── RootLayout.tsx
├──── HomePage.tsx
├──── bootstrap.tsx
├──── index.ts
├──── register.tsx
├── .browserslistrc
├── swc.dev.js
├── swc.build.js
├── webpack.dev.js
├── webpack.build.js
├── package.json
```

Then, ensure that you are developing your application using [ESM syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) by specifying `type: module` in your `package.json` file:

```json !#2 host/package.json
{
    "type": "module"
}
```

Finally, use a dynamic import to add an async boundary:

```ts !#3 host/src/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore doesn't support file extension.
import("./bootstrap");

// TS1208: 'index.tsx' cannot be compiled under '--isolatedModules' because it is considered a global script file. Add an import, export, or an
// empty 'export {}' statement to make it a module.
export {};
```

!!!tip
To learn more about this async boundary and the `bootstrap.tsx` file, read the following [article](https://dev.to/infoxicator/module-federation-shared-api-ach#using-an-async-boundary).
!!!

### Module registration

Next, to register the modules, instanciate a shell [FireflyRuntime](/reference/runtime/FireflyRuntime.md) instance and register the remote module with the [initializeFirefly](/reference/registration/initializeFirefly.md) function (the configuration of the remote module will be covered in the [next section](create-remote-module.md)):

```tsx !#12-14 host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider } from "@squide/firefly";
import { initializeFirefly, type RemoteDefinition } from "@squide/firefly-module-federation";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Register the remote module.
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

Then, render the [AppRouter](../reference/routing/AppRouter.md) component to define a React Router [browser instance](https://reactrouter.com/en/main/routers/create-browser-router) configured with the registered routes:

```tsx !#5-23 host/src/App.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

export function App() {
    return (
        <AppRouter>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: registeredRoutes
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

### Navigation items

Next, create a layout component to [render the navigation items](/reference/routing/useRenderedNavigationItems.md). In many applications, multiple pages often share a **common layout** that includes elements such as a navigation bar, a user profile menu, and a main content section. In a [React Router](https://reactrouter.com/en/main) application, this shared layout is commonly referred to as a `RootLayout`:

```tsx !#40,43 host/src/RootLayout.tsx
import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key) => {
    // To keep thing simple, this sample doesn't support nested navigation items.
    // For an example including support for nested navigation items, have a look at
    // https://workleap.github.io/wl-squide/reference/routing/userenderednavigationitems/
    if (!isNavigationLink(item)) {
        return null;
    }

    const { label, linkProps, additionalProps } = item;

    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

export function RootLayout() {
    // Retrieve the navigation items registered by the remote modules.
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

The `RootLayout` component created in the previous sample will serves as the default layout for the homepage as well as for every page (route) registered by a module that are not nested under a parent route with either the [parentPath](../reference/runtime/FireflyRuntime.md#register-nested-routes) or the [parentId](../reference/runtime/FireflyRuntime.md#register-a-route-with-an-id) option.

### Homepage

Next, create the `HomePage` component that will serve as the homepage:

```tsx host/src/HomePage.tsx
export function HomePage() {
    return (
        <div>Hello from the Home page!</div>
    );
}
```

Then, add a local module at the root of the host application to register the homepage:

```tsx !#4-9 host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { HomePage } from "./HomePage.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });
};
```

And an [hoisted route](../reference/runtime/FireflyRuntime.md#register-an-hoisted-route) to render the `RootLayout` with the [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) placeholders:

```tsx !#8,11,12,15 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { HomePage } from "./HomePage.tsx";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Pathless route to declare a root layout.
        element: <RootLayout />,
        children: [
            // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });
};
```

!!!tip
The [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) placeholders indicates where routes that are neither hoisted or nested with a [parentPath](../reference/runtime/FireflyRuntime.md#register-nested-navigation-items) or [parentId](../reference/runtime/FireflyRuntime.md#register-a-route-with-an-id) option will be rendered. In this example, the homepage route is considered as a protected route and will be rendered under the `ProtectedRoutes` placeholder.
!!!

Finally, update the bootstrapping code to register the newly created local module:

```tsx !#14 host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider } from "@squide/firefly";
import { initializeFirefly, type RemoteDefinition } from "@squide/firefly-module-federation";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Register the modules.
const runtime = initializeFirefly({
    localModules: [registerHost],
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Not found page (404)

Now, let's ensure that users who enter a wrong URL end up somewhere by registering a custom [no-match route](https://reactrouter.com/en/main/start/faq#how-do-i-add-a-no-match-404-route-in-react-router-v6). First, create the `NotFoundPage` component, which will serve as the page for handling not found routes:

```tsx host/src/NotFoundPage.tsx
export function NotFoundPage() {
    return (
        <div>Not found! Please try another page.</div>
    );
}
```

Then, register the newly created component as the `*` route:

```tsx !#18-21 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });
};
```

## Configure webpack

!!!tip
Squide webpack configuration is built on top of [@workleap/webpack-configs](https://workleap.github.io/wl-web-configs/webpack/), [@workleap/browserslist-config](https://workleap.github.io/wl-web-configs/browserslist/) and [@workleap/swc-configs](https://workleap.github.io/wl-web-configs/swc/). If you are having issues with the configuration of these tools, refer to the tools documentation websites.
!!!

First, open the `public/index.html` file created at the beginning of this guide and copy/paste the following [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/) template:

```html host/public/index.html
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
```

Then, open the `.browserslist` file and copy/paste the following content:

```!#1 host/.browserslistrc
extends @workleap/browserslist-config
```

### Development configuration

To configure webpack for a **development** environment, first open the `swc.dev.js` file and copy/paste the following code:

```js !#5,7 host/swc.dev.js
// @ts-check

import { browserslistToSwc, defineDevConfig } from "@workleap/swc-configs";

const targets = browserslistToSwc();

export const swcConfig = defineDevConfig(targets);
```

Then, open the `webpack.dev.js` file and use the [defineDevHostConfig](/reference/webpack/defineDevHostConfig.md) function to configure webpack:

```js !#13 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, Remotes);
```

> If you are having issues with the wepack configuration that are not related to module federation, refer to the [@workleap/webpack-configs](https://workleap.github.io/wl-web-configs/webpack/configure-dev/) documentation.

!!!tip
If the application _**does not**_ not include any remote modules, use the [defineDevConfig](https://workleap.github.io/wl-web-configs/webpack/configure-dev/) function instead of [defineDevHostConfig](../reference/webpack/defineDevHostConfig.md).
!!!

### Build configuration

To configure webpack for a **build** environment, first open the `swc.build.js` file and copy/paste the following code:

```js !#5,7 host/swc.build.js
// @ts-check

import { browserslistToSwc, defineBuildConfig } from "@workleap/swc-configs";

const targets = browserslistToSwc();

export const swcConfig = defineBuildConfig(targets);
```

Then, open the `webpack.build.js` file and use the [defineBuildHostConfig](/reference/webpack/defineBuildHostConfig.md) function to configure webpack:

```js !#13 host/webpack.build.js
// @ts-check

import { defineBuildHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineBuildHostConfig(swcConfig, Remotes);
```

> If you are having issues with the wepack configuration that are not related to module federation, refer to the [@workleap/webpack-configs](https://workleap.github.io/wl-web-configs/webpack/configure-build/) documentation.

!!!tip
If the application _**does not**_ not include any remote modules, use the [defineBuildConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-build/) function instead of [defineBuildHostConfig](../reference/webpack/defineBuildHostConfig.md).
!!!

## Add CLI scripts

To initiate the development server, add the following script to the application `package.json` file:

```json !#2 host/package.json
{
    "dev": "webpack serve --config webpack.dev.js"
}
```

To build the application, add the following script to the application `package.json` file:

```json !#2 host/package.json
{
    "build": "webpack --config webpack.build.js"
}
```

## Try it :rocket:

Start the application in a development environment using the `dev` script. You should see the homepage. Even if the remote module application is not yet available, the host application will gracefully (and ignore the remote module).

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] Found 1 local module to register.`
    - `[squide] 1/1 Registering local module.`
    - `[squide] 1/1 Local module registration completed.`
    - `[squide] Found 1 remote module to register.`
    - `[squide] 1/1 Loading module "register" of "remote1".`
    - `[squide] 1/1 Registering module "register" of remote "remote1".`
    - `[squide] 1/1 The registration of the remote "remote1" is completed.`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/basic/host).
- Refer to the [troubleshooting](../troubleshooting.md) page.
