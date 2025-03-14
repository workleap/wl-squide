---
order: 760
---

# Override a React context

In a modular application, it's typical to configure various global [React context](https://legacy.reactjs.org/docs/context.html) at the root of the host application. These contexts are then used by the layouts and pages of the modules.

Let's explore a simple example using a `BackgroundColorContext`:

```tsx !#8 host/src/App.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { BackgroundColorContext } from "@sample/shared";

export function App() {
    return (
        <BackgroundColorContext.Provider value="blue">
            <AppRouter waitForMsw={false}>
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
        </BackgroundColorContext.Provider>
    );
}
```

```tsx !#7 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { ColoredPage } from "./ColoredPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/colored-page",
        element: <ColoredPage />
    });
}
```

```tsx !#4 remote-module/src/ColoredPage.tsx
import { useBackgroundColor } from "@sample/shared";

export function ColoredPage() {
    const backgroundColor = useBackgroundColor();

    return (
        <div style={{ backgroundColor }}>
            The background color is "{backgroundColor}"
        </div>
    );
}
```

In the previous code samples, the host application provides a value for the `BackgroundColorContext`, and the `ColoredPage` component of the remote module uses this value to set its background color (to `blue` for this example).

## Override the context for the module

Now, suppose the requirements change, and a page of the remote module must have a `red` background. The context can be overriden for that page by declaring a new provider directly in the routes registration:

```tsx !#9 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { BackgroundColorContext } from "@sample/shared";
import { ColoredPage } from "./ColoredPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/colored-page",
        element: (
            <BackgroundColorContext.Provider value="red">
                <ColoredPage />
            </BackgroundColorContext.Provider>
        )
    });
}
```

### Extract an utility component

Since there are multiple routes to setup with the new provider, an utility component can be extracted:

```tsx !#6-12,17 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { BackgroundColorContext } from "@sample/shared";
import { ColoredPage } from "./ColoredPage.tsx";
import type { ReactNode } from "react";

function RedBackground({ children }: { children: ReactNode }) {
    return (
        <BackgroundColorContext.Provider value="red">
            {children}
        </BackgroundColorContext.Provider>
    );
}

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/colored-page",
        element: <RedBackground><ColoredPage /></RedBackground>
    });
}
```

## Update a singleton dependency version

!!!warning
This section only applies to federated applications (applications including [remote modules](../reference/registration/registerRemoteModules.md)).
!!!

Let's consider a more specific use case where the host application declares a `ThemeContext` from Workleap's new design system, [Hopper](https://hopper.workleap.design/):

```tsx !#8 host/src/App.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ThemeContext } from "@hopper/components";

export function App() {
    return (
        <ThemeContext.Provider value="dark">
            <AppRouter waitForMsw={false}>
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
        </ThemeContext.Provider>
    );
}
```

In this scenario, Hopper's components are used throughout the entire application, including the modules. Moreover, `@hopper/components` is defined as a [singleton](https://module-federation.io/configure/shared.html#singleton) shared dependency:

```js !#8-10 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevHostConfig(swcConfig, 8080, [...], {
    sharedDependencies: {
        "@hopper/components": {
            singleton: true
        }
    }
});
```

```js !#8-10 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote-module", 8080, {
    sharedDependencies: {
        "@hopper/components": {
            singleton: true
        }
    }
});
```

Now, consider a situation where Hopper releases a new version of the package that includes breaking changes, without a "compatibility" package to ensure backward compatility with the previous version.

To update the host application without breaking the modules, we recommend to temporary "break" the singleton shared dependency by loading two versions of the `@hopper/components` dependency in parallel (one for the host application and one for the modules that have not been updated yet):

```js !#8-10 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote-module", 8080, {
    sharedDependencies: {
        "@hopper/components": {
            singleton: false
        }
    }
});
```

As `@hopper/components` expose the `ThemeContext`, the context must be re-declared in each module until every part of the federated application has been updated to the latest version of `@hopper/components`:

```tsx !#6-12,17 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { ThemeContext } from "@hopper/components";
import { Page } from "./Page.tsx";
import type { ReactNode } from "react";

function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeContext.Provider value="dark">
            {children}
        </ThemeContext.Provider>
    )
}

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page",
        element: <Providers><Page /></Providers>
    });
}
```

Thankfully, [React Router](https://reactrouter.com/en/main) makes it very easy to declare contexts in a module.
