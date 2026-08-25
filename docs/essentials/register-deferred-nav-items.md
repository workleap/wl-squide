---
order: 480
label: Register deferred navigation items
---

# Register deferred navigation items

Navigation items cannot always be registered before the application bootstrapping process, as some of them depend on remote data and/or feature flags.

To address this, Squide offers an alternate deferred registration mechanism in **two-phases**:

1. The first phase allows modules to register their navigation items that are **not dependent** on remote data or feature flags.
2. The second phase enables modules to register deferred navigation items that are dependent on remote data and/or feature flags by returning a function. We refer to this second phase as **deferred registrations**.

For more details, refer to the [initializeFirefly](../reference/registration/initializeFirefly.md#defer-the-registration-of-navigation-items) and [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) reference documentation.

## Register a deferred item

To defer a registration to the second phase, a module's registration function can return an anonymous function matching the `DeferredRegistrationFunction` type: `(data, operation: "register" | "update") => Promise | void`.

### Remote data

The returned registration function can conditionally register navigation items based on the remote data passed as its second argument:

```tsx !#7-16
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Once the user data has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the user data.
    return (deferredRuntime, { userData }) => {
        // Only register the "feature-a" route and navigation item if the user is an administrator.
        if (userData.isAdmin) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: "Feature A",
                to: "/feature-a"
            });
        }
    };
};
```

### Feature flags

And/or based on a LaunchDarkly feature flag:

```tsx !#7-16
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Once the user data has been loaded by the host application, by completing the module registrations process,
    // the deferred registration function will be called with the user data.
    return (deferredRuntime) => {
        // Only register the "feature-a" route and navigation item if "feature-a" flag is activated.
        if (deferredRuntime.getFeatureFlag("enable-feature-a")) {
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

## Execute the deferred registrations

It's the responsibility of the application shell to execute deferred registrations. If deferred registrations depend on remote data, register them once that data has been retrieved:

==- :icon-file-code: Shell code with remote data example
```tsx !#7-21,23-27,29,40
import { AppRouter, useIsBootstrapping, usePublicDataQueries, useDeferredRegistrations } from "@squide/firefly";
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
===

Otherwise, the deferred registrations can be registered without providing a data object:

==- :icon-file-code: Shell code without remote data example
```tsx !#6
import { AppRouter, useIsBootstrapping, useDeferredRegistrations } from "@squide/firefly";
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
===

## Update deferred items

Since Squide integrates with [TanStack Query](https://tanstack.com/query/latest) and [LaunchDarkly](https://launchdarkly.com/) feature flags, and both regularly get fresh data from the server, the remote data or feature flags on which deferred navigation items depend may change over time. When this happens, the deferred navigation items must be updated to reflect the current state of the application. For example, a user could be promoted from a regular user to an administrator and should then see additional navigation items. Similarly, a feature flag might enable or disable a feature, which would require navigation items to be added or removed accordingly.

### Remote data updates

By using the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook in combination with TanStack Query, deferred registrations are automatically updated whenever a fresh remote data object is forwarded to `useDeferredRegistrations`:

==- :icon-file-code: Shell code with remote data example
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
===

### Feature flag updates

However, if conditional navigation items only depend on feature flags, the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook can be balled without a data object. Deferred registrations will still be updated automatically whenever a feature flag value changes:

==- :icon-file-code: Shell code without remote data example
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
===

## Deferred registrations run again on every update

A deferred registration function is not executed once. It runs again every time the deferred registrations are updated, whenever a feature flag value changes or the data passed to [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) changes.

Squide discards everything the previous run registered before replaying the new one. Every run must therefore register the **full set** of navigation items it wants rendered, not the difference since the last run:

```ts !#4-10
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = () => {
    return (deferredRuntime) => {
        if (deferredRuntime.getFeatureFlag("enable-feature-a")) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: "Feature A",
                to: "/feature-a"
            });
        }
    };
};
```

!!!warning
Squide builds the navigation **sections** it renders from the registrations rather than storing the objects it received, so a nested item is never attached to an object owned by a module. Two consequences: mutating a section after registering it does not change what the menu renders, and the section returned by [getNavigationItems](../reference/runtime/FireflyRuntime.md#retrieve-navigation-items) is not the object that was registered. Compare sections by `$id`. Links are returned as they were registered, as nothing is ever attached to them.
!!!

## Missing sections are reported

When a nested navigation item is registered with a `sectionId` that no registered section matches, the item is held as a pending registration and is not rendered. Squide reports the sections that are still missing once the modules are ready, and again after every deferred registration update. In development the report throws, in production it is logged.

This is what surfaces a deferred registration function that stops registering a section while another module keeps registering items under it. Set [strictMode](../reference/routing/AppRouter.md#disable-strict-mode) to `false` on `AppRouter` to turn the validation off.

## Conflicting section declarations are reported

Declaring a section that is already registered for a menu is [supported](./register-nav-items.md#declare-a-section-from-multiple-modules): the first declaration wins and the following ones contribute nothing. Squide reports two situations where that silently loses something. In development the report throws, in production it is logged, and `strictMode={false}` turns it off with the rest.

**An ignored declaration** carried inline `children`, a `$canRender` the registered section doesn't have, or a `$priority`, a `sectionId` or a string `$label` that differs from the registered section's. Those are discarded, so the report names the menu, the section, and what each declaration would have contributed. An option the registered section already has is discarded by nobody and is never reported, which is what lets every module declare a shared section identically. A declaration written inside another section's `children` is reported too, because it is dropped from where it was written together with everything declared under it. The report names the section it was written in when that section has an `$id`. A re-declaration registered at the root of the menu and carrying none of those is the supported shape and is never reported.

**A declaration that does not own the identifier** is a section that was waiting for its own section, and found its `$id` already taken by the time that section was registered. It is rendered where it was registered, but items nested with that `$id` reach the other section. Two sections of one menu answering to the same `$id` is never intended, so this one is always reported.
