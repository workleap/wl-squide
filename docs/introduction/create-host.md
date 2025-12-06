---
order: 100
label: Create an host application
---

# Create an host application

!!!info Use an existing template
We highly recommend going through the entire getting started guide. However, if you prefer to scaffold the application we'll be building, a template is available with [degit](https://github.com/Rich-Harris/degit):

```bash
pnpx degit https://github.com/workleap/wl-squide/templates/getting-started
```
!!!

Let's begin by creating the application that will serve as the entry point for our modular application and host the application modules.

## Install the packages

Create a new application (we'll refer to ours as `host`), then open a terminal at the root of the new solution and install the following packages:

```bash
pnpm add -D @workleap/rsbuild-configs @workleap/browserslist-config @rsbuild/core @rspack/core browserslist typescript @types/react @types/react-dom
pnpm add @squide/firefly react react-dom react-router msw @tanstack/react-query
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
├──── index.tsx
├──── register.tsx
├── .browserslistrc
├── rsbuild.dev.ts
├── rsbuild.build.ts
├── package.json
```

Then, ensure that you are developing your application using [ESM syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) by specifying `type: module` in your `package.json` file:

```json !#2 host/package.json
{
    "type": "module"
}
```

### Module registration

Next, to register the modules, instanciate a shell [FireflyRuntime](/reference/runtime/FireflyRuntime.md) instance. A local module will be registered in the [next section](create-local-module.md) of this quick start guide:

```tsx !#5 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { App } from "./App.tsx";

const runtime = initializeFirefly();

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

Then, render the [AppRouter](../reference/routing/AppRouter.md) component to define a React Router [browser instance](https://reactrouter.com/en/main/routers/create-browser-router) configured with the registered routes:

```tsx !#5-11,15-34 host/src/App.tsx
import { AppRouter, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

function BootstrappingRoute() {
    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function App() {
    return (
        <AppRouter>
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

### Navigation items

Next, create a layout component to [render the navigation items](/reference/routing/useRenderedNavigationItems.md). In many applications, multiple pages often share a **common layout** that includes elements such as a navigation bar, a user profile menu, and a main content section. In a [React Router](https://reactrouter.com/en/main) application, this shared layout is commonly referred to as a `RootLayout`:

```tsx !#39,42 host/src/RootLayout.tsx
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
    // Retrieve the navigation items registered by the modules.
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

And, update the bootstrapping code to register the newly created local module:

```tsx !#6-8 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHost } from "./register.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Register the root layout

Finally, add an [hoisted route](../reference/runtime/FireflyRuntime.md#register-an-hoisted-route) to render the `RootLayout` with the [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) placeholders:

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

### Not found page (404)

Now, let's ensure that users who enter a wrong URL end up somewhere by registering a custom no-match route. First, create the `NotFoundPage` component, which will serve as the page for handling not found routes:

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

## Configure Rsbuild

!!!tip
For additional information about this Rsbuild setup, refer to the [development](https://workleap.github.io/wl-web-configs/rsbuild/configure-dev/) and [production](https://workleap.github.io/wl-web-configs/rsbuild/configure-build/) configuration documentation of the [Web Configs](https://workleap.github.io/wl-web-configs/rsbuild) libraries.
!!!

First, open the `public/index.html` file created at the beginning of this guide and copy/paste the following template:

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

To configure Rsbuild for a **development** environment, open the `rsbuild.dev.ts` file and use the [defineDevConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-dev/#rsbuilddevts) function to configure Rsbuild:

```ts !#3 host/rsbuild.dev.ts
import { defineDevConfig } from "@workleap/rsbuild-configs";

export default defineDevConfig();
```

### Build configuration

To configure Rsbuild for a **build** environment, open the `rsbuild.build.ts` file and use the [defineBuildConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-build/#rsbuildbuildts) function to configure Rsbuild:

```ts !#3 host/rsbuild.build.ts
import { defineBuildConfig } from "@workleap/rsbuild-configs";

export default defineBuildConfig();
```

## Add CLI scripts

To initiate the development server, add the following script to the application `package.json` file:

```json !#2 host/package.json
{
    "dev": "rsbuild dev --config ./rsbuild.dev.ts"
}
```

To build the application, add the following script to the application `package.json` file:

```json !#2 host/package.json
{
    "build": "rsbuild build --config rsbuild.build.ts"
}
```

## Try it :rocket:

Start the application in a development environment using the `dev` script. You should see the homepage.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] Found 1 local module to register.`
    - `[squide] 1/1 Registering local module.`
    - `[squide] 1/1 Local module registration completed.`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/basic/host).
- Refer to the [troubleshooting](../troubleshooting.md) page.

