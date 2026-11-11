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
            <AppRouter>
                {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => {
                    return (
                        <RouterProvider
                            router={createBrowserRouter([
                                {
                                    element: rootRoute,
                                    children: registeredRoutes
                                }
                            ], routerProps)}
                            {...routerProviderProps}
                        />
                    );
                }}
            </AppRouter>
        </BackgroundColorContext.Provider>
    );
}
```

```tsx !#7 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { ColoredPage } from "./ColoredPage.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/colored-page",
        element: <ColoredPage />
    });
}
```

```tsx !#4 local-module/src/ColoredPage.tsx
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

In the previous code samples, the host application provides a value for the `BackgroundColorContext`, and the `ColoredPage` component of the local module uses this value to set its background color (to `blue` for this example).

## Override the context for the module

Now, suppose the requirements change, and a page of the local module must have a `red` background. The context can be overriden for that page by declaring a new provider directly in the routes registration:

```tsx !#9 local-module/src/register.tsx
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

```tsx !#6-12,17 local-module/src/register.tsx
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
