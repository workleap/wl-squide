---
order: 1000
label: Migrate to firefly v9.0
---

# Migrate to firefly v9.0

!!!warning
Although this migration guide is labeled for version `9.0.0`, it is actually intended for migrating from version `8.*` to version `9.2.1`. Therefore, please ensure you upgrade to `@squide/firefly` version `9.2.1` instead of `9.0.0`.

We apologize for the confusion.
!!!

This major version of `@squide/firefly` introduces [TanStack Query](https://tanstack.com/query/latest) as the official library for fetching the global data of a Squide's application and features a complete rewrite of the [AppRouter](../reference/routing/appRouter.md) component, which now uses a state machine to manage the application's bootstrapping flow.

Prior to `v9.0`, Squide applications couldn't use TanStack Query to fetch global data, making it **challenging** for Workleap's applications to **keep** their **global data** in **sync** with the **server state**. With `v9.0`, applications can now leverage [custom wrappers](../guides/fetch-global-data.md) of the TanStack Query's [useQueries](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) hook to fetch and keep their global data up-to-date with the server state. Additionally, the new [deferred registrations update](../reference/registration/useDeferredRegistrations.md#register-or-update-deferred-registrations) feature allows applications to even **keep** their conditional **navigation items in sync** with the **server state**.

Finally, with `v9.0`, Squide's philosophy has evolved. We used to describe Squide as a shell for **federated** applications. Now, we refer to Squide as a shell for **modular** applications. After playing with Squide's [local module](../reference/registration/registerLocalModules.md) feature for a while, we discovered that Squide offers [significant value](../getting-started/default.md#why-squide) even for **non-federated applications**, which triggered this shift in philosophy.

## Breaking changes

### Removed

- The `useAreModulesRegistered` hook has been removed, use the [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) hook instead.
- The `useAreModulesReady` hook has been removed, use the [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) hook instead.
- The `useIsMswStarted` hook has been removed, use the [useIsBootstrapping](../reference/routing/useIsBootstrapping.md) hook instead.
- The `completeModuleRegistrations` function as been removed use the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook instead.
- The `completeLocalModulesRegistrations` function has been removed use the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook instead.
- The `completeRemoteModuleRegistrations` function has been removed use the [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook instead.
- The `useSession` hook has been removed, define your own React context instead.
- The `useIsAuthenticated` hook has been removed, define your own React context instead.
- The `sessionAccessor` option has been removed from the [FireflyRuntime](../reference/runtime/runtime-class.md) options, define your own React context instead.
- The `ManagedRoutes`placeholder has been removed, use [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) instead.

### Renamed

- The `setMswAsStarted` function has been renamed to [setMswIsReady](../reference/msw/setMswAsReady.md).
- A route definition `$name` option has been renamed to [$id](../reference/runtime/runtime-class.md#register-a-route-with-an-id).
- The [registerRoute](../reference/runtime/runtime-class.md#register-routes) `parentName` option has been renamed to [parentId](../reference/runtime/runtime-class.md#register-nested-routes).

### Others

- The `@squide/firefly` package now takes a peerDependency on `@tanstack/react-query`.
- The `@squide/firefly` package doesn't takes a peerDependency on `react-error-boundary` anymore.

### Removed support for deferred routes

[Deferred registration](../reference/registration/registerLocalModules.md#defer-the-registration-of-navigation-items) functions no longer support route registration; they are now **exclusively** used for **registering navigation items**. Since deferred registration functions can now be re-executed whenever the global data changes, registering routes in deferred registration functions no longer makes sense as updating the routes registry after the application has bootstrapped could lead to issues.

This change is a significant improvement for Squide's internals, allowing us to eliminate quirks like:

- Treating unknown routes as `protected`: When a user initially requested a deferred route, Squide couldn't determine if the route was `public` or `protected` because it wasn't registered yet. As a result, for that initial request, the route was considered `protected`, even if the deferred registration later registered it as `public`.

- Mandatory wildcard `*` route registration: Previously, Squide's bootstrapping would fail if the application didn't include a wildcard route.

Before:

```tsx !#4-7
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    return ({ featureFlags }) => {
        if (featureFlags?.featureB) {
            runtime.registerRoute({
                path: "/page",
                element: <Page />
            });

            runtime.registerNavigationItem({
                $id: "page",
                $label: "Page",
                to: "/page"
            });
        }
    };
}
```

Now:

```tsx !#2-5
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });

    return ({ featureFlags }) => {
        if (featureFlags?.featureB) {
            runtime.registerNavigationItem({
                $id: "page",
                $label: "Page",
                to: "/page"
            });
        }
    };
}
```

#### Conditional routes

To handle direct access to a conditional route, each conditional route's endpoint should return a `403` status code if the user is not authorized to view the route. Those `403` errors should then be handled by the nearest error boundary.

### Plugin's constructors now requires a runtime instance

Prior to this release, plugin instances received the current runtime instance through a `_setRuntime` function. This approach caused issues because some plugins required a reference to the runtime at instantiation. To address this, plugins now receive the **runtime instance** directly as a **constructor** argument.

Before:

```tsx !#8-10
export class MyPlugin extends Plugin {
    readonly #runtime: Runtime;

    constructor() {
        super(MyPlugin.name);
    }

    _setRuntime(runtime: Runtime) {
        this.#runtime = runtime;
    }
}
```

Now:

```tsx !#2
export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }
}
```

### Plugins now registers with a factory function

Prior to this release, the [FireflyRuntime](../reference/runtime/runtime-class.md) accepted plugin instances as options. Now, `FireflyRuntime` accepts **factory functions** instead of plugin instances. This change allows plugins to receive the runtime instance as a constructor argument.

Before:

```tsx
const runtime = new FireflyRuntime({
    plugins: [new MyPlugin()]
});
```

Now:

```tsx
const runtime = new FireflyRuntime({
    plugins: [x => new MyPlugin(x)]
});
```

### Rewrite of the `AppRouter` component

This release features a full rewrite of the [AppRouter](../reference/routing/appRouter.md) component. The `AppRouter` component used to handle many concerns like global data fetching, deferred registrations, error handling and a loading state. Those concerns have been delegated to the consumer code, supported by the new [useIsBootstrapping](../reference/routing/useIsBootstrapping.md), [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md), [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) and [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hooks.

Before:

```tsx
export function App() {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>();
    const [subscription, setSubscription] = useState<FeatureFlags>();

    const handleLoadPublicData = useCallback((signal: AbortSignal) => {
        return fetchPublicData(setFeatureFlags, signal);
    }, []);

    const handleLoadProtectedData = useCallback((signal: AbortController) => {
        return fetchProtectedData(setSubscription, signal);
    }, []);

    const handleCompleteRegistrations = useCallback(() => {
        return completeModuleRegistrations(runtime, {
            featureFlags,
            subscription
        });
    }, [runtime, featureFlags, subscription]);

    return (
        <AppRouter
            fallbackElement={<div>Loading...</div>}
            errorElement={<RootErrorBoundary />}
            waitForMsw
            onLoadPublicData={handleLoadPublicData}
            onLoadProtectedData={handleLoadProtectedData}
            isPublicDataLoaded={!!featureFlags}
            isPublicDataLoaded={!!subscription}
            onCompleteRegistrations={handleCompleteRegistrations}
        >
            {(routes, providerProps) => (
                <RouterProvider router={createBrowserRouter(routes)} {...providerProps} />
            )}
        </AppRouter>
    );
}
```

Now:

```tsx
function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([getFeatureFlagsQuery]);
    const [subscription] = useProtectedDataQueries([getSubscriptionQuery]);

    const data: DeferredRegistrationData = useMemo(() => ({ 
        featureFlags,
        subscription
    }), [featureFlags, subscription]);

    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}

export function App() {
    return (
        <AppRouter waitForMsw waitForPublicData>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                errorElement: <RootErrorBoundary />,
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

## New hooks and functions

- A new [useIsBoostrapping](../reference/routing/useIsBootstrapping.md) hook is now available.
- A new [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook is now available.
- A new [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md) hook is now available.
- A new [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hook is now available.
- A new [isGlobalDataQueriesError](../reference/tanstack-query/isGlobalDataQueriesError.md) function is now available.
- A new [registerPublicRoute](../reference/runtime/runtime-class.md#register-a-public-route) function is now available.

## Improvements

- Deferred registration functions now always receive a `data` argument.
- Deferred registration functions now receives a new [operations](../reference/registration/registerLocalModules.md#use-the-deferred-registration-operation-argument) argument.
- Navigation items now include a [$canRender](../reference/runtime/runtime-class.md#conditionally-render-a-navigation-item) option, enabling modules to control whether a navigation item should be rendered.

### New `$id` option for navigation items

Navigation items now supports a new `$id` option. Previously, most navigation item React elements used a `key` property generated by concatenating the item's `level` and `index`, which goes against React's best practices:

```tsx
<li key={`${level}-${index}`}>
```

It wasn't that much of a big deal since navigation items never changed once the application was bootstrapped. Now, with the deferred registration functions re-executing when the global data changes, the registered navigation items can be updated post-bootstrapping. The new `$id` option allows the navigation item to be configured with a unique key at registration, preventing UI shifts.

```tsx !#2
runtime.registerNavigationItem({
    $id: "page-1",
    $label: "Page 1",
    to: "/page-1"
});
```

The configured `$id` option is then passed as a `key` argument to the [useRenderedNavigationItems](../reference/routing/useRenderedNavigationItems.md) rendering functions:

```tsx !#1,5,13,15
const renderItem: RenderItemFunction = (item, key) => {
    const { label, linkProps, additionalProps } = item;

    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);
```

> If no `$id` is configured for a navigation item, the `key` argument will be a concatenation of the `level` and `index` argument.

## Migrate an host application

> A migration example from `v8` to `v9` is available for the [wl-squide-monorepo-template](https://github.com/workleap/wl-squide-monorepo-template/commit/87489f0541cc959f437133f2afd8c0a9db160efe).

The `v9.0` release introduces several breaking changes affecting the host application code. Follow these steps to migrate an existing host application:

1. Add a dependency to `@tanstack/react-query`. [View example](https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file)
2. Transition to the new `AppRouter` component. [View example](#rewrite-of-the-approuter-component)
    - `onLoadPublicData` + `isPublicDataLoaded` becomes [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md)
    - `onLoadProtectedData` + `isProtectedDataLoaded` becomes [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md)
    - `onCompleteRegistrations` becomes [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md)
    - `fallbackElement` becomes [useIsBootstrapping](../reference/routing/useIsBootstrapping.md)
    - `errorElement` is removed and somewhat replaced by a [root error boundary](#root-error-boundary)
3. Create a `TanStackSessionManager` class and the `SessionManagerContext`. Replace the session's deprecated hooks by creating the customs `useSession` and `useIsAuthenticated` hooks. [View example](../guides/add-authentication.md#create-a-session-manager)
4. Remove the `sessionAccessor` option from the `FireflyRuntime` instance. Update the `BootstrappingRoute` component to create a `TanStackSessionManager` instance and share it down the component tree using a `SessionManagedContext` provider. [View example](../guides/add-authentication.md#fetch-the-session)
5. Add or update the `AuthenticationBoundary` component to use the new `useIsAuthenticated` hook. Global data fetch request shouldn't be throwing 401 error anymore when the user is not authenticated. [View example](../guides/add-authentication.md#add-an-authentication-boundary)
6. Update the `AuthenticatedLayout` component to use the session manager instance to clear the session. Retrieve the session manager instance from the context defined in the `BootstrappingRoute` component using the `useSessionManager` hook. [View example](../guides/add-authentication.md#define-an-authenticated-layout)
7. Update the `AuthenticatedLayout` component to use the new `key` argument. [View example](#new-id-option-for-navigation-items)
8. Replace the `ManagedRoutes` placeholder with the new [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) placeholders. [View example](../getting-started/create-host.md#homepage)
9. Convert all deferred routes into static routes. [View example](#removed-support-for-deferred-routes)
10. Add an `$id` option to the navigation item registrations. [View example](#new-id-option-for-navigation-items)

### `waitForMsw`, `waitForPublicData`, `waitForProtectedData`

The `AppRouter` component accepts the `waitForMsw`, `waitForPublicData`, and `waitForProtectedData` properties. These properties are forwarded directly to the Squide bootstrapping flow state machine, where they are used to determine its initial state.

If the application register MSW [request handlers](https://mswjs.io/docs/concepts/request-handler/) with the [runtime.registerRequestHandlers](../reference/runtime/runtime-class.md#register-request-handlers) function, add the `waitForMsw` property to the `AppRouter` component:

```tsx
<AppRouter waitForMsw>
    ...
</AppRouter>
```

If the application uses the [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md), add the `waitForPublicData` property to the `AppRouter` component:

```tsx
<AppRouter waitForPublicData>
    ...
</AppRouter>
```

If the application uses the [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md), add the `waitForProtectedData` property to the `AppRouter` component:

```tsx
<AppRouter waitForProtectedData>
    ...
</AppRouter>
```

Otherwise, don't define any of those three properties on the `AppRouter` component.

### Root error boundary

When transitioning to the new `AppRouter` component, make sure to nest the `RootErrorBoundary` component within the `AppRouter` component's render function.

Before:

```tsx !#6-7
export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            {
                $id: "root-error-boundary",
                errorElement: <RootErrorBoundary />,
                children: [
                    ManagedRoutes
                ]
            }
        ]
    });
});
```

Now:

```tsx !#10
export function App() {
    return (
        <AppRouter waitForMsw>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                errorElement: <RootErrorBoundary />,
                                children: registeredRoutes
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

## Migrate a module

> A migration example from `v8` to `v9` is available for the [wl-squide-monorepo-template](https://github.com/workleap/wl-squide-monorepo-template/commit/87489f0541cc959f437133f2afd8c0a9db160efe).

The changes in `v9.0` have minimal impact on module code. To migrate an existing module, follow these steps:

1. Convert all deferred routes into static routes. [View example](#removed-support-for-deferred-routes)
2. Add a `$id` option to the navigation item registrations. [View example](#new-id-option-for-navigation-items)

!!!warning
Ensure that modules registering deferred routes are updated to convert those routes into static routes and are deployed before the host application. **Failure to do so may lead to runtime errors in the production environment**.
!!!

### Isolated development

If your module is set up for [isolated development](../guides/develop-a-module-in-isolation.md), ensure that you also apply the [host application migration steps](#migrate-an-host-application) to your isolated setup.
