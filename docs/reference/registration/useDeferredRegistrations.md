---
toc:
    depth: 2-3
---

# useDeferredRegistrations

Register the modules [deferred registration](./initializeFirefly.md#defer-the-registration-of-navigation-items) functions when the global data is initially fetched and update the deferred registration functions whenever the global data or the feature flags changes.

!!!tip
This hook should always be used in combination with [deferred registrations](./initializeFirefly.md#defer-the-registration-of-navigation-items).
!!!

!!!tip
Every run of this hook is bracketed by a scope that [plugins](../plugins/Plugin.md#react-to-deferred-registrations) can hook into to clear and replay their own registry.
!!!

## Reference

```ts
useDeferredRegistrations(data?: {}, options?: { onError? });
```

### Parameters

- `data`: An optional object literal of data that will be passed to the deferred registration functions.
- `options`: An optional object literal of options:
    - `onError`: An optional function receiving an array of `ModuleRegistrationError` instances as argument.

### Returns

Nothing

## Usage

### Register or update deferred registrations with global data

If the deferred registration depends on remote data (and optionally on feature flags as well), the registrations must be registered and updated with a data object.

```tsx !#18-21,23 host/src/App.tsx
import { usePublicDataQueries, useProtectedDataQueries, useDeferredRegistrations, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { useMemo } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { DeferredRegistrationData } from "@sample/shared";
import { getUserInfoQuery } from "./getUserInfoQuery.ts";
import { getSessionQuery } from "./getSessionQuery.ts";
import { isApiError } from "./isApiError.ts";

function BootstrappingRoute() {
    const [userInfo] = usePublicDataQueries([getUserInfoQuery]);

    const [session] = useProtectedDataQueries(
        [getSessionQuery],
        error => isApiError(error) && error.status === 401
    );

    const data: DeferredRegistrationData = useMemo(() => ({
        userInfo,
        session
    }), [userInfo, session]);

    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function App() {
    return (
        <AppRouter waitForPublicData waitForProtectedData>
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

### Register or update deferred registrations without global data

If the deferred registration only depends on feature flags, the deferred registrations can be registered or updated without providing a data object.

```tsx !#6 host/src/App.tsx
import { useDeferredRegistrations, useIsBootstrapping, AppRouter } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";

function BootstrappingRoute() {
    useDeferredRegistrations();

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

### Handle registration errors

```tsx !#4-8,11 host/src/App.tsx
import { useDeferredRegistrations, type DeferredRegistrationsErrorCallback } from "@squide/firefly";

function BootstrappingRoute() {
    const handleErrors: DeferredRegistrationsErrorCallback = errors => {
        errors.forEach(x => {
            console.error(x);
        });
    };

    useDeferredRegistrations(undefined, {
        onError: handleErrors
    });

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```

### Await a bootstrap side effect

A deferred registration function can be asynchronous. Squide awaits every deferred registration function before the modules become ready, therefore before [useIsBootstrapping](../routing/useIsBootstrapping.md) returns `false`. A module can rely on this to complete a side effect that depends on the global data before the first page renders, such as switching every `i18next` instance to the session's preferred language with the [i18nextPlugin](../i18next/i18nextPlugin.md#change-the-current-language):

```tsx !#6-8 host/src/register.tsx
import { getI18nextPlugin } from "@squide/i18next";

export const registerHost: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    return async (deferredRuntime, data) => {
        await i18nextPlugin.changeLanguage(data.session?.user.preferredLanguage ?? i18nextPlugin.currentLanguage);
    };
};
```

The rejection of an awaited side effect is reported like any other deferred registration error: it reaches the `onError` callback as the `cause` of a `ModuleRegistrationError`, and the run still completes for the other modules. An awaited network request lengthens the deferred registration phase, keep such side effects to what must happen before the first render.
