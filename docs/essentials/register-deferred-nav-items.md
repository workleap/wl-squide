---
order: 480
label: Register deferred navigation items
---

# Register deferred navigation items

Navigation items cannot always be registered before the application bootstrapping process, as some of them depend on remote data or feature flags.

To address this, Squide offers an alternate deferred registration mechanism in **two-phases**:

1. The first phase allows modules to register their navigation items that are **not dependent** on remote data or feature flags.
2. The second phase enables modules to register deferred navigation items that are dependent on remote data or feature flags by returning a function. We refer to this second phase as **deferred registrations**.

For more details, refer to the [initializeFirefly](../reference/registration/initializeFirefly.md#defer-the-registration-of-navigation-items) and [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) reference documentation.

## Register a deferred item

To defer a registration to the second phase, a module's registration function can return an anonymous function matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`:

```tsx !#7-17
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Once the user data has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the user data.
    return (deferredRuntime, { userData }) => {
        // Only register the "feature-a" route and navigation item if the user is an administrator
        // and the "feature-a" flag is activated.
        if (userData.isAdmin && deferredRuntime.getFeatureFlag("enable-feature-a")) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: "Feature A",
                to: "/feature-a"
            });
        }
    };
};
```

==- :icon-file-code: @sample/shared
```ts !#1-3,5-7 
export interface UserInfo {
    isAdmin: boolean;
}

export interface DeferredRegistrationData {
    userInfo?: UserInfo;
}
```
===

!!!tip
It's important to register conditional navigation items using the `deferredRuntime` argument rather than the root `runtime` argument.
!!!

It's the responsibility of the application shell code to execute the deferred registrations once the remote data is retrieved.

==- :icon-file-code: Shell code example
```tsx !#7-21,23-27,29,40
import { AppRouter, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { DeferredRegistrationData, UserInfo } from "@sample/shared";

function BootstrappingRoute() {
    const [userInfo] = usePublicDataQueries([
        {
            queryKey: ["/api/user-info"],
            queryFn: async () => {
                const response = await fetch("/api/user-info");
                const data = await response.json();

                const userInfo: UserInfo = {
                    isAdmin: data.isAdmin
                };

                return userInfo;
            }
        }
    ]);

    // The useMemo hook is super important otherwise the hook will consider that the user info
    // object changed everytime the hook is rendered.
    const data: DeferredRegistrationData = useMemo(() => ({ 
        userInfo 
    }), [userInfo]);

    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function App() {
    return (
        <AppRouter waitForPublicData>
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
===

## Update deferred items

Since Squide integrates with [TanStack Query](https://tanstack.com/query/latest) and [LaunchDarkly](https://launchdarkly.com/) feature flags, and both regularly get fresh data from the server, the remote data or feature flags on which deferred navigation items depend may change over time. When this happens, the deferred navigation items must be updated to reflect the current state of the application. For example, a user could be promoted from a regular user to an administrator and should then see additional navigation items. Similarly, a feature flag might enable or disable a feature, which would require navigation items to be added or removed accordingly.

### Remote data updates

By using the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook in combination with TanStack Query, deferred registrations are automatically updated whenever a fresh remote data object is forwarded to `useDeferredRegistrations`:

```tsx !#24-26,28
import { useIsBootstrapping, useDeferredRegistrations, usePublicDataQueries } from "@squide/firefly";
import { Outlet } from "react-router";
import { DeferredRegistrationData, UserInfo } from "@sample/shared";

function BootstrappingRoute() {
    const [userInfo] = usePublicDataQueries([
        {
            queryKey: ["/api/user-info"],
            queryFn: async () => {
                const response = await fetch("/api/user-info");
                const data = await response.json();

                const userInfo: UserInfo = {
                    isAdmin: data.isAdmin
                };

                return userInfo;
            }
        }
    ]);

    // The useMemo hook is super important otherwise the hook will consider that the user info
    // object changed everytime the hook is rendered.
    const data: DeferredRegistrationData = useMemo(() => ({ 
        userInfo 
    }), [userInfo]);

    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```

### Feature flag updates

When the LaunchDarkly SDK client provided during [initialization](../reference/registration/initializeFirefly.md) notifies Squide that a feature flag value has changed, Squide automatically updates deferred registrations. In this case, the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook can be called **with or without a data object**:

```tsx !#5
import { useIsBootstrapping, useDeferredRegistrations } from "@squide/firefly";
import { Outlet } from "react-router";

function BootstrappingRoute() {
    useDeferredRegistrations();

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```



