---
order: 90
toc:
    depth: 2-3
---

# useIsBootstrapping

Indicate whether the application is currently being bootstrapped, such as registering modules, handling deferred registrations, preparing [Mock Service Worker](https://mswjs.io/), fetching global data, waiting for [plugins](../plugins/Plugin.md#report-readiness) to be ready, etc.

The hook returns `true` until every one of the following inputs is ready. Each input is a one-way latch: once ready, it never becomes unready again.

- The modules are registered and their deferred registrations are registered.
- MSW is ready, when enabled.
- Every plugin implementing the [readiness surface](../plugins/Plugin.md#report-readiness) is ready, for example the [i18nextPlugin](../i18next/i18nextPlugin.md) has loaded the resources of the current language.
- The public global data is ready, when `waitForPublicData` is set on [AppRouter](./AppRouter.md).
- The protected global data is ready, when `waitForProtectedData` is set on [AppRouter](./AppRouter.md) and the active route is protected.

When a global data request returns a `401` status code, the protected data and deferred registration inputs are bypassed so the login page can render. The MSW, plugins and public data inputs still apply, because the login page usually lives in a module that depends on them.

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

```tsx !#6
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
        <AppRouter>
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => {
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
                        ], routerProps)}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```
