---
order: 90
toc:
    depth: 2-3
---

# useIsBootstrapping

Indicate whether the application is currently being bootstrapped, such as registering modules, handling deferred registrations, preparing [Mock Service Worker](https://mswjs.io/), fetching global data, etc.

## Reference

```ts
const isBootstrapping = useIsBootstrapping();
```

### Parameters

None

### Returns

A `boolean` value indicating whether or not the application is bootstrapping.

## Usage

A `BootstrappingRoute` component is introduced in the following example because this hook must be rendered as a child of `rootRoute`.

```tsx !#6 host/src/App.tsx
import { useIsBootstrapping, AppRouter } from "@squide/firefly";
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
        <AppRouter waitForMsw={false}>
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
