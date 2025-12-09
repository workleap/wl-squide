---
toc:
    depth: 2-3
---

# useDeferredRegistrations

Register the modules [deferred registration](./initializeFirefly.md#defer-the-registration-of-navigation-items) functions when the global data is initially fetched and update the deferred registration functions whenever the global data or the feature flags changes.

!!!tip
This hook should always be used in combination with [deferred registration](./initializeFirefly.md#defer-the-registration-of-navigation-items) functions and with either the [usePublicDataQueries](../global-data-fetching/usePublicDataQueries.md) hook or the [useProtectedDataQueries](../global-data-fetching/useProtectedDataQueries.md) hook (can be both).
!!!

## Reference

```ts
useDeferredRegistrations(data: {}, options?: { onError? });
```

### Parameters

- `data`: An object literal of data that will be passed to the deferred registration functions.
- `options`: An optional object literal of options:
    - `onError`: An optional function receiving an array of `ModuleRegistrationError` instances as argument.

### Returns

Nothing

## Usage

### Register or update deferred registrations

```tsx !#18-23 host/src/AppRouter.tsx
import { usePublicDataQueries, useProtectedDataQueries, useDeferredRegistrations, useIsBootstrapping, AppRouter as FireflyAppRouter } from "@squide/firefly";
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

export function AppRouter() {
    return (
        <FireflyAppRouter>
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
        </FireflyAppRouter>
    );
}
```

### Handle registration errors

```tsx !#11-15,18 host/src/AppRouter.tsx
import { useDeferredRegistrations, type DeferredRegistrationsErrorCallback } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";
import { useMemo } from "react";
import { getUserInfoQuery } from "./getUserInfoQuery";

function BootstrappingRoute() {
    const [userInfo] = usePublicDataQueries([getUserInfoQuery]);

    const data: DeferredRegistrationData = useMemo(() => ({ userInfo }), [userInfo]);

    const handleErrors: DeferredRegistrationsErrorCallback = errors => {
        errors.forEach(x => {
            console.error(x);
        });
    };

    useDeferredRegistrations(data, {
        onError: handleErrors
    });

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```
