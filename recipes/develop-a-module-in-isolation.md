# Develop a module in isolation

To develop their own independent module, a team should not need to install the host application or any other modules of the application they do not own. However, they should have a way to integrate their module with the application shell (e.g., `RootLayout`, `RootErrorBoundary`, etc..) while working in isolation.

To achieve this, the first step is to extract the application shell from the host application. There are various ways to accomplish this, but in this guide, we'll transform the host application into a monorepo and introduce a new local package named `@sample/shell` specifically for this purpose:

``` !#4-11
monorepo
├── apps
├── libs
├────── shell
├───────── src
├─────────── RootLayout.tsx
├─────────── RootErrorBoundary.tsx
├─────────── AppRouter.tsx
├─────────── register.tsx
├─────────── index.ts
├───────── package.json
├── modules
├────── local-module
```

## Create a shell package

!!!info
The implementation details of the `RootLayout`, `RootErrorBoundary` and `ModuleErrorBoundary` components won't be covered by this guide as it already has been covered many times by other guides.

For additional information refer to the [create an host app](../introduction/create-host.md) and [define error boundaries](../essentials/define-error-boundaries.md) guides.
!!!

First, create a new package (we'll refer to ours as `shell`) and add the following fields to the `package.json` file:

```json shell/package.json
{
    "name": "@sample/shell",
    "version": "0.0.1",
    "type": "module",
    "exports": "./src/index.ts"
}
```

Then, install the package dependencies and create an `AppRouter` component in the shell package to provide a **reusable router configuration** that can be shared between the host application and the isolated modules. This new `AppRouter` component should wrap the `@squide/firefly` [AppRouter](../reference/routing/AppRouter.md) component:

```tsx !#6-25 shell/src/AppRouter.tsx
import { AppRouter as FireflyAppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

export function AppRouter() {
    return (
        <FireflyAppRouter>
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                errorElement: <RootErrorBoundary />,
                                children: registeredRoutes
                            }
                        ], routerProps)}
                        {...routerProviderProps}
                    />
                );
            }}
        </FireflyAppRouter>
    );
}
```

Finally, create a local module to register the **application shell**. This module will be used by both the host application and the isolated modules:

```tsx !#5-20 shell/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";
import { ModuleErrorBoundary } from "./ModuleErrorBoundary.tsx";

export const registerShell: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            {
                errorElement: <ModuleErrorBoundary />,
                children: [
                    PublicRoutes,
                    ProtectedRoutes
                ]
            }
        ]
    }, {
        hoist: true
    });
};
```

!!!info
This guide only covers the `RootLayout`, `RootErrorBoundary` and `ModuleErrorBoundary` components but the same goes for other shell assets such as an `AuthenticationBoundary` component.
!!!

## Update the host application

Now, let's revisit the host application by adding the new `@sample/shell` package as a dependency:

```json !#3 host/package.json
{
    "dependencies": {
        "@sample/shell": "0.0.1"
    }
}
```

Then, integrate the `AppRouter` component from the `@sample/shell` package into the application:

```tsx !#5 host/src/App.tsx
import { AppRouter } from "@sample/shell";

export function App() {
    return (
        <AppRouter />
    );
}
```

And finally include the `registerShell` function to setup the `RootLayout` and `RootErrorBoundary` components as well as any other shell assets:

```tsx !#9 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";
import { registerShell } from "@sample/shell";

const runtime = initializeFirefly({
    // Register the newly created shell module.
    localModules: [registerShell, registerHost]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Setup a local module

With the new `shell` package in place, we can now configure the local module to be developed in isolation. The goal is to start a development server and render the module pages with the **same layout and shared functionalities** as if it was rendered by the host application.

A local module is usually not bundled on its own. The Rsbuild configuration of this guide strictly serves the purpose of starting a development server for isolated development.

To begin, open a terminal at the root of the local module and install the following packages:

```bash
pnpm add -D @workleap/rsbuild-configs @workleap/browserslist-config @rsbuild/core @rspack/core browserslist
```

Then, add a development dependency to the `@sample/shell` package:

```json !#3 local-module/package.json
{
    "devDependencies": {
        "@sample/shell": "0.0.1"
    }
}
```

Then, create the following files in the local module:

``` !#2-3,5-9,12-13
local-module
├── public
├──── index.html
├── src
├────── dev
├────────── App.tsx
├────────── DevHome.tsx
├────────── index.tsx
├────────── register.tsx
├────── register.tsx
├────── Page.tsx
├── .browserslistrc
├── rsbuild.dev.ts
├── package.json
```

### index.tsx

The `index.tsx` file is similar to the `index.tsx` file of an host application but, tailored for an isolated module. The key distinction is that a new `registerDev` function is introduced to register the development homepage (which will be covered in an upcoming section):

```tsx !#8-10 local-module/src/dev/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { App } from "./App.tsx";
import { register as registerModule } from "../register.tsx";
import { registerDev } from "./register.tsx";
import { registerShell } from "@sample/shell";

const runtime = initializeFirefly({
    localModules: [registerShell, registerDev, registerModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### App.tsx

The `App.tsx` file uses the newly created `AppRouter` component to setup Squide's primitives with a [React Router](https://reactrouter.com/) instance:

```tsx !#5 local-module/src/dev/App.tsx
import { AppRouter } from "@sample/shell";

export function App() {
    return (
        <AppRouter />
    );
}
```

### DevHome.tsx

The `DevHome` component is the homepage when the local module is developed in isolation:

```tsx local-module/src/dev/DevHome.tsx
export function DevHome() {
    return (
        <div>
            <h2>Local module development home page</h2>
            <p>Hey!</p>
        </div>
    );
}
```

To register the development homepage, create a new local module specifically for configuring the module during isolated development:

```tsx !#4-9 local-module/src/dev/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { DevHome } from "./DevHome.tsx";

export const registerDev: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        index: true,
        element: <DevHome />
    });
}
```

### Configure Rsbuild

First, open the `public/index.html` file created at the beginning of this guide and copy/paste the following template:

```html local-module/public/index.html
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
```

Then, open the `.browserslistrc` file and copy/paste the following content:

```!#1 local-module/.browserslistrc
extends @workleap/browserslist-config
```

Finally, open the `rsbuild.dev.ts` file and use the [defineDevConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-dev/#rsbuilddevts) function to configure Rsbuild with the `dev/index.tsx` file as the entry point:

```ts !#5-7 local-module/rsbuild.dev.ts
import { defineDevConfig } from "@workleap/rsbuild-configs";
import path from "node:path";

export default defineDevConfig({
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    }
});
```

!!!tip
If you encounter issues configuring Rsbuild, refer to the [@workleap/rsbuild-configs](https://workleap.github.io/wl-web-configs/rsbuild/) documentation.
!!!

### Add a new CLI script

Next, add a new `dev-isolated` script to the `package.json` file to start the local development server in **isolation**:

```json !#2 local-module/package.json
{
    "dev-isolated": "rsbuild dev --config ./rsbuild.dev.ts"
}
```

### Try it :rocket:

Start the local module in isolation by running the `dev-isolated` script. The application shell should wrap the pages of the module and the default page should be `DevHome`.

#### Troubleshoot issues

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/basic/local-module).
- Refer to the [troubleshooting](../troubleshooting.md) page.
