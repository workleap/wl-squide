---
toc:
    depth: 2-3
---

# useDeferredRegistrations

Register the modules [deferred registration](./registerLocalModules.md#defer-the-registration-of-navigation-items) functions when the global data is initially fetched or update the deferred registration functions whenever the global data change.

!!!info
This hook should always be used in combination with [deferred registration](./registerLocalModules.md#defer-the-registration-of-navigation-items) functions and with either the [usePublicDataQueries](../tanstack-query/usePublicDataQueries.md) hook or the [useProtectedDataQueries](../tanstack-query/useProtectedDataQueries.md) hook (can be both).
!!!

## Reference

```ts
useDeferredRegistrations(data: {}, options?: { onError? });
```

### Parameters

- `data`: An object literal of data that will be passed to the deferred registration functions.
- `options`: An optional object literal of options:
    - `onError`: An optional function receiving an `DeferredRegistrationsErrorsObject` object as an argument.

#### `DeferredRegistrationsErrorsObject`

- `localModuleErrors`: An array of errors that occured during the deferred registrations of local modules.
    - `error`: The original `Error` object.
- `remoteModuleErrors`: An array of errors that occured during the deferred registrations of remote modules.
    - `remoteName`: The name of the remote module that failed to load.
    - `moduleName`: The name of the [module](./registerRemoteModules.md#name) that Squide attempted to recover.
    - `error`: The original `Error` object.

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
import { getFeatureFlagsQuery } from "./getFeatureFlagsQuery.ts";
import { getSessionQuery } from "./getSessionQuery.ts";
import { isApiError } from "./isApiError.ts";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([getFeatureFlagsQuery]);

    const [session] = useProtectedDataQueries(
        [getSessionQuery],
        error => isApiError(error) && error.status === 401
    );

    const data: DeferredRegistrationData = useMemo(() => ({
        featureFlags,
        session
    }), [featureFlags, session]);

    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function AppRouter() {
    return (
        <FireflyAppRouter waitForMsw={false}>
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

```tsx !#10-18,21 host/src/AppRouter.tsx
import { useDeferredRegistrations, type DeferredRegistrationsErrorCallback } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";
import { useMemo } from "react";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([getFeatureFlagsQuery]);

    const data: DeferredRegistrationData = useMemo(() => ({ featureFlags }), [featureFlags]);

    const handleErrors: DeferredRegistrationsErrorCallback = ({ localModuleErrors, remoteModuleErrors }) => {
        localModuleErrors.forEach(x => {
            console.error(x);
        });

        remoteModuleErrors.forEach(x => {
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
