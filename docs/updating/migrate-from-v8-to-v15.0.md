---
order: 800
label: Migrate from v8.* to v15.0
---

# Migrate from v8.* to v15.0

This migration guide is an aggregation of all the changes that happened between Squide Firefly `v9.0` and `v15.0`:

## Changes summary

### v9.0

:icon-checklist: [Migrate to firefly v9.0](./migrate-to-firefly-v9.0.md)

This major version of `@squide/firefly` introduces [TanStack Query](https://tanstack.com/query/latest) as the official library for fetching the global data of a Squide's application and features a complete rewrite of the [AppRouter](../reference/routing/AppRouter.md) component, which now uses a state machine to manage the application's bootstrapping flow.

Prior to `v9.0`, Squide applications couldn't use TanStack Query to fetch global data, making it **challenging** for Workleap's applications to **keep** their **global data** in **sync** with the **server state**. With `v9.0`, applications can now leverage [custom wrappers](../guides/fetch-global-data.md) of the TanStack Query's [useQueries](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries) hook to fetch and keep their global data up-to-date with the server state. Additionally, the new [deferred registrations update](../reference/registration/useDeferredRegistrations.md#register-or-update-deferred-registrations) feature allows applications to even **keep** their conditional **navigation items in sync** with the **server state**.

Finally, with `v9.0`, Squide's philosophy has evolved. We used to describe Squide as a shell for **federated** applications. Now, we refer to Squide as a shell for **modular** applications. After playing with Squide's local module feature for a while, we discovered that Squide offers significant value even for **non-federated applications**, which triggered this shift in philosophy.

### v9.3

:icon-checklist: [Migrate to firefly v9.3](./migrate-to-firefly-v9.3.md)

This minor version deprecate the `registerLocalModules`, `registerRemoteModules` in favor of a `bootstrap` function.

### v10.0

:icon-checklist: [Migrate to firefly v10.0](./migrate-to-firefly-v10.0.md)

This major version introduces support for [React Router](https://reactrouter.com) `v7`. The peer dependencies for `@squide/firefly` and `@squide/react-router` have been updated from `react-router-dom@6*` to `react-router@7*` and the React Router shared dependency name has been renamed from `react-router-dom` to `react-router` for `@squide/firefly-webpack-configs` and `@squide/firefly-rsbuild-configs`.

### v11.0

:icon-checklist: [Migrate to firefly v11.0](./migrate-to-firefly-v11.0.md)

This major version transform the `bootstrap` function from an async function a sync function. It also introduces a new [FireflyProvider](../reference/runtime/FireflyProvider.md) alias for `RuntimeContext.Provider`.

### v12.0

:icon-checklist: [Migrate to firefly v12.0](./migrate-to-firefly-v12.0.md)

This major version introduces a new [initializeFirefly](../reference/registration/initializeFirefly.md) function, replacing the `bootstrap` function. This new `initializeFirefly` function is similar to the previous `bootstrap` function with the addition that it takes care of creating and returning a [Runtime](../reference/runtime/FireflyRuntime.md) instance and initializing other internal features of Squide.

### v13.0

:icon-checklist: [Migrate to firefly v13.0](./migrate-to-firefly-v13.0.md)

This major version deprecates the [@squide/firefly-honeycomb](https://www.npmjs.com/package/@squide/firefly-honeycomb) package in favor of [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb).

### v14.0

:icon-checklist: [Migrate to firefly v14.0](./migrate-to-firefly-v14.0.md)

This major version introduces a new first argument to deferred registration functions.

### v15.0

:icon-checklist: [Migrate to firefly v15.0](./migrate-to-firefly-v15.0.md)

This major version changes how Squide integrates with [Honeycomb](https://www.honeycomb.io/). In previous versions, the Honeycomb integration depended on global variables registered by the [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) package. Starting with this version, Squide integrates with Honeycomb only when it is initialized with a [HoneycombInstrumentationClient](https://workleap.github.io/wl-telemetry/reference/telemetry/honeycombinstrumentationclient/) instance.

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
- The `sessionAccessor` option has been removed from the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) options, define your own React context instead.
- The `ManagedRoutes`placeholder has been removed, use [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) instead.

### Renamed

- The `setMswAsStarted` function has been renamed to [setMswIsReady](../reference/msw/setMswAsReady.md).
- A route definition `$name` option has been renamed to [$id](../reference/runtime/FireflyRuntime.md#register-a-route-with-an-id).
- The [registerRoute](../reference/runtime/FireflyRuntime.md#register-routes) `parentName` option has been renamed to [parentId](../reference/runtime/FireflyRuntime.md#register-nested-routes).

### Dependencies updates

- The `@squide/firefly` package now has a peerDependency on `@tanstack/react-query`.
- The `@squide/firefly` package doesn't have a peerDependency on `react-error-boundary` anymore.
- The `@squide/firefly` package doesn't support `react-router-dom@6*` anymore, remove the `reacy-router-dom` dependency and update to `react-router@7*`.

### Deprecation

- The `registerLocalModules` function has been **deprecated**, use the `bootstrap` function instead.
- The `registerRemoteModules` function has been **deprecated**, use the `bootstrap` function instead.
- The [setMswAsReady](../reference/msw/setMswAsReady.md) function has been **deprecated**, use the `bootstrap` function instead.
- The `RuntimeContext.Provider` has been **deprecated**, use [FireflyProvider](../reference/runtime/FireflyProvider.md) instead.
- The [@squide/firefly-honeycomb](https://www.npmjs.com/package/@squide/firefly-honeycomb) package has been **deprecated**.

### Update deferred registration functions signature

As of `v14.0`, Deferred registration functions now receive a runtime instance as their first argument.

Before:

```ts !#1,2,4
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    return ({ featureFlags }, operation) => {
        if (featureFlags.featureA) {
            runtime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
```

After:

```ts !#2,4
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    return (deferredRuntime, { featureFlags }, operation) => {
        if (featureFlags.featureA) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
```

### Removed support for deferred routes

As of `v9.0`, Deferred registration functions no longer support route registration; they are now **exclusively** used for **registering navigation items**. Since deferred registration functions can now be re-executed whenever the global data changes, registering routes in deferred registration functions no longer makes sense as updating the routes registry after the application has bootstrapped could lead to issues.

This change is a significant improvement for Squide's internals, allowing us to eliminate quirks like:

- Treating unknown routes as `protected`: When a user initially requested a deferred route, Squide couldn't determine if the route was `public` or `protected` because it wasn't registered yet. As a result, for that initial request, the route was considered `protected`, even if the deferred registration later registered it as `public`.

- Mandatory wildcard `*` route registration: Previously, Squide's bootstrapping would fail if the application didn't include a wildcard route.

Before:

```tsx !#4-7 register.tsx
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

```tsx !#2-5 register.tsx
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });

    return (deferredRuntime, { featureFlags }) => {
        if (featureFlags?.featureB) {
            deferredRuntime.registerNavigationItem({
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

Prior to `v9.0`, plugin instances received the current runtime instance through a `_setRuntime` function. This approach caused issues because some plugins required a reference to the runtime at instantiation. To address this, plugins now receive the **runtime instance** directly as a **constructor** argument.

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

Prior to `v9.0`, the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) accepted plugin instances as options. Now plugins should be registered with the [initializeFirefly](../reference/registration/initializeFirefly.md) function which accepts **factory functions** instead of plugin instances. This change allows plugins to receive the runtime instance as a constructor argument.

Before:

```tsx !#4 bootstrap.tsx
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [new MyPlugin()]
});
```

Now:

```tsx !#4 bootstrap.tsx
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

### Rewrite of the `AppRouter` component

`v9.0` features a full rewrite of the [AppRouter](../reference/routing/AppRouter.md) component. The `AppRouter` component used to handle many concerns like global data fetching, deferred registrations, error handling and a loading state. Those concerns have been delegated to the consumer code, supported by the new [useIsBootstrapping](../reference/routing/useIsBootstrapping.md), [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md), [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) and [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hooks.

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

```tsx !#4 bootstrap.tsx
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    useMsw: true
});
```

```tsx AppRouter.tsx
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
        <AppRouter waitForPublicData>
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

### Use the `initializeFirefly` function

Versions `v9.3`, `v11.0` and `v12.0` introduce changes to how the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance should be created and how the modules should be registered.

Before:

```tsx !#13,16,19 bootstrap.tsx
import { FireflyProvider, FireflyRuntime, registerRemoteModules, registerLocalModules, type RemoteDefinition } from "@squide/firefly";
import { register as registerMyLocalModule } from "@getting-started/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime();

// Register the local module.
await registerLocalModules([registerHost, registerMyLocalModule], runtime);

// Register the remote module.
await registerRemoteModules(Remotes, runtime);

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

Now:

```tsx !#12-15 bootstrap.tsx
import { FireflyProvider, FireflyRuntime, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { register as registerMyLocalModule } from "@getting-started/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

const runtime = initializeFirefly(runtime, {
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Rename `RuntimeContext.Provider` to `FireflyProvider`

`v11.0` introduces the [FireflyProvider](../reference/runtime/FireflyProvider.md) alias for `RuntimeContext.Provider`. This change is optionnal as both are still supported, but strongly encouraged.

Before:

```tsx
import { initializeFirefly, RuntimeContext } from "@squide/firefly";
import { createRoot } from "react-dom/client";

const runtime = initializeFirefly();

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

Now:

```tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { createRoot } from "react-dom/client";

const runtime = initializeFirefly();

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Replace `react-router-dom` with `react-router`

`v10` introduces an update to React Router `v7`. In React Router `v7`, `react-router-dom` is no longer required, as the package structure has been simplified. All necessary imports are now available from either `react-router` or `react-router/dom`.

#### Preparation

Before migrating to React Router `v7`, it is highly recommended to read React Router [migration guide](https://reactrouter.com/upgrading/v6) and activate the "future flags" one by one to minimize breaking changes.

Before:

```tsx
<RouterProvider
    router={createBrowserRouter([
        {
            element: rootRoute,
            children: registeredRoutes
        }
    ])}
    {...routerProviderProps}
/>
```

Now:

```tsx
<RouterProvider
    router={createBrowserRouter([
        {
            element: rootRoute,
            children: registeredRoutes
        }
    ], {
        future: {
            v7_relativeSplatPath: true
        }
    })}
    {...routerProviderProps}
/>
```

If your application is already on React Router `v7`, you can ignore this advice.

#### Update dependencies

Open a terminal at the root of the project workspace and use the following commands to remove `react-router-dom` and install `react-router@latest`:

```bash
pnpm remove react-router-dom
pnpm add react-router@latest
```

#### Update Imports

In your code, update all imports from `react-router-dom` to `react-router`, except for `RouterProvider`, which must be imported from `react-router/dom`.

Before:

```ts
import { Outlet, createBrowserRouter, RouterProvider } from "react-router-dom";
```

Now:

```ts
import { Outlet, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
```

According to React Router [migration guide](https://reactrouter.com/upgrading/v6#upgrade-to-v7), you can use the following command to update the imports from `react-router-dom` to `react-router`:

```bash
find ./path/to/src \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) -type f -exec sed -i '' 's|from "react-router-dom"|from "react-router"|g' {} +
```

## New hooks and functions

- A new [useIsBoostrapping](../reference/routing/useIsBootstrapping.md) hook is now available.
- A new [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md) hook is now available.
- A new [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md) hook is now available.
- A new [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hook is now available.
- A new [isGlobalDataQueriesError](../reference/tanstack-query/isGlobalDataQueriesError.md) function is now available.
- A new [registerPublicRoute](../reference/runtime/FireflyRuntime.md#register-a-public-route) function is now available.

## Improvements

- Deferred registration functions now always receive a `data` argument.
- Deferred registration functions now receives a new operations argument.
- Navigation items now include a [$canRender](../reference/runtime/FireflyRuntime.md#conditionally-render-a-navigation-item) option, enabling modules to control whether a navigation item should be rendered.

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

Follow these steps to migrate an existing host application:

1. Add a dependency to `@tanstack/react-query`.
2. Remove the `react-router-dom` dependency and update to `react-router@7*`. [View example](#replace-react-router-dom-with-react-router)
3. Transition to the new `AppRouter` component. [View example](#rewrite-of-the-approuter-component)
    - `onLoadPublicData` + `isPublicDataLoaded` becomes [usePublicDataQueries](../reference/tanstack-query/usePublicDataQueries.md)
    - `onLoadProtectedData` + `isProtectedDataLoaded` becomes [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md)
    - `onCompleteRegistrations` becomes [useDeferredRegistrations](../reference/registration/useDeferredRegistrations.md)
    - `fallbackElement` becomes [useIsBootstrapping](../reference/routing/useIsBootstrapping.md)
    - `errorElement` is removed and somewhat replaced by a [root error boundary](#root-error-boundary)
4. Create a `TanStackSessionManager` class and the `SessionManagerContext`. Replace the session's deprecated hooks by creating the customs `useSession` and `useIsAuthenticated` hooks. [View example](../guides/add-authentication.md#create-a-session-manager)
5. Remove the `sessionAccessor` option from the `FireflyRuntime` instance. Update the `BootstrappingRoute` component to create a `TanStackSessionManager` instance and share it down the component tree using a `SessionManagedContext` provider. [View example](../guides/add-authentication.md#fetch-the-session)
6. Add or update the `AuthenticationBoundary` component to use the new `useIsAuthenticated` hook. Global data fetch request shouldn't be throwing 401 error anymore when the user is not authenticated. [View example](../guides/add-authentication.md#add-an-authentication-boundary)
7. Update the `AuthenticatedLayout` component to use the session manager instance to clear the session. Retrieve the session manager instance from the context defined in the `BootstrappingRoute` component using the `useSessionManager` hook. [View example](../guides/add-authentication.md#define-an-authenticated-layout)
8. Update the `AuthenticatedLayout` component to use the new `key` argument. [View example](#new-id-option-for-navigation-items)
9. Replace the `ManagedRoutes` placeholder with the new [PublicRoutes](../reference/routing/publicRoutes.md) and [ProtectedRoutes](../reference/routing/protectedRoutes.md) placeholders. [View example](../introduction/create-host.md#homepage)
10. Convert all deferred routes into static routes. [View example](#removed-support-for-deferred-routes)
11. Add an `$id` option to the navigation item registrations. [View example](#new-id-option-for-navigation-items)
12. Replace the `registerLocalModules`, `registerRemoteModules`, [setMswAsReady](../reference/msw/setMswAsReady.md) function and the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) by the [initializeFirefly](../reference/registration/initializeFirefly.md) function. [View example](#use-the-initializefirefly-function)
13. Rename `RuntimeContext.Provider` for [FireflyProvider](../reference/runtime/FireflyProvider.md). [View example](#rename-runtimecontextprovider-to-fireflyprovider)

### `useMsw`

If the application register MSW [request handlers](https://mswjs.io/docs/concepts/request-handler/) with the [runtime.registerRequestHandlers](../reference/runtime/FireflyRuntime.md#register-request-handlers) function, add the `useMsw` property to the [initializeFirefly](../reference/registration/initializeFirefly.md) function:

```tsx
initializeFirefly({
    useMsw: true
})
```

### `waitForPublicData`, `waitForProtectedData`

The `AppRouter` component accepts the `waitForPublicData`, and `waitForProtectedData` properties. These properties are forwarded directly to the Squide bootstrapping flow state machine, where they are used to determine its initial state.

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
        <AppRouter>
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

The changes have minimal impact on module code. To migrate an existing module, follow these steps:

1. Remove the `react-router-dom` dependency and update to `react-router@7*`. [View example](#replace-react-router-dom-with-react-router)
2. Add a `runtime` argument as the first parameter of deferred registration functions. [View example](#update-deferred-registration-functions-signature)
3. Convert all deferred routes into static routes. [View example](#removed-support-for-deferred-routes)
4. Add a `$id` option to the navigation item registrations. [View example](#new-id-option-for-navigation-items)

!!!warning
Ensure that modules registering deferred routes are updated to convert those routes into static routes and are deployed before the host application. **Failure to do so may lead to runtime errors in the production environment**.
!!!

### Isolated development

If your module is set up for [isolated development](../guides/develop-a-module-in-isolation.md), ensure that you also apply the [host application migration steps](#migrate-an-host-application) to your isolated setup.
