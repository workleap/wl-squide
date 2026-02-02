# Squide Components Reference

## AppRouter

The main router component that sets up Squide's primitives with React Router.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `waitForPublicData` | `boolean` | `false` | Delay rendering until public data queries complete |
| `waitForProtectedData` | `boolean` | `false` | Delay rendering until protected data queries complete |
| `children` | `function` | required | Render function for router setup |

### Render Function Arguments

```ts
{
    rootRoute: ReactElement;      // Root route element (must wrap registeredRoutes)
    registeredRoutes: Route[];    // All registered routes
    routerProviderProps: object;  // Props for RouterProvider
}
```

### Basic Usage

```tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

export function App() {
    return (
        <AppRouter>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => (
                <RouterProvider
                    router={createBrowserRouter([{
                        element: rootRoute,
                        children: registeredRoutes
                    }])}
                    {...routerProviderProps}
                />
            )}
        </AppRouter>
    );
}
```

### With Bootstrapping Route

```tsx
function BootstrappingRoute() {
    if (useIsBootstrapping()) {
        return <LoadingSpinner />;
    }
    return <Outlet />;
}

export function App() {
    return (
        <AppRouter>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => (
                <RouterProvider
                    router={createBrowserRouter([{
                        element: rootRoute,
                        children: [{
                            element: <BootstrappingRoute />,
                            children: registeredRoutes
                        }]
                    }])}
                    {...routerProviderProps}
                />
            )}
        </AppRouter>
    );
}
```

### With Data Fetching

```tsx
function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([sessionQuery], is401Error);

    if (useIsBootstrapping()) {
        return <LoadingSpinner />;
    }

    return (
        <SessionContext.Provider value={session}>
            <Outlet />
        </SessionContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter waitForProtectedData>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => (
                <RouterProvider
                    router={createBrowserRouter([{
                        element: rootRoute,
                        children: [{
                            element: <BootstrappingRoute />,
                            children: registeredRoutes
                        }]
                    }])}
                    {...routerProviderProps}
                />
            )}
        </AppRouter>
    );
}
```

## FireflyProvider

Context provider for the FireflyRuntime instance.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `runtime` | `FireflyRuntime` | The runtime instance |
| `children` | `ReactNode` | Child components |

### Usage

```tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({ localModules: [...] });

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## PublicRoutes

Placeholder component indicating where public routes will be rendered.

### Usage

```tsx
import { PublicRoutes, ProtectedRoutes } from "@squide/firefly";

runtime.registerRoute({
    element: <RootLayout />,
    children: [
        PublicRoutes,      // Public routes render here
        ProtectedRoutes    // Protected routes render here
    ]
}, { hoist: true });
```

## ProtectedRoutes

Placeholder component indicating where protected routes will be rendered.

### Usage

See `PublicRoutes` above - they are typically used together.

## I18nextNavigationItemLabel (from `@squide/i18next`)

Component for rendering localized navigation item labels.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `i18next` | `i18n` | i18next instance |
| `namespace` | `string` | Optional namespace (default: `"navigationItems"`) |
| `resourceKey` | `string` | Translation key |

### Usage

```tsx
import { I18nextNavigationItemLabel } from "@squide/i18next";

runtime.registerNavigationItem({
    $id: "home",
    $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="nav.home" />,
    to: "/"
});
```

With a custom namespace:

```tsx
runtime.registerNavigationItem({
    $id: "about",
    $label: <I18nextNavigationItemLabel i18next={i18nextInstance} namespace="another-namespace" resourceKey="aboutPage" />,
    to: "/about"
});
```

## Storybook Components (from `@squide/firefly-rsbuild-storybook`)

### FireflyDecorator

Decorator for wrapping Storybook stories with Squide context, including a RouterProvider.

```tsx
import { FireflyDecorator, initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    decorators: [
        story => (
            <FireflyDecorator runtime={runtime}>
                {story()}
            </FireflyDecorator>
        )
    ],
    parameters: {
        msw: {
            handlers: [...runtime.requestHandlers]
        }
    }
};
```

### withFireflyDecorator

Factory function for creating the FireflyDecorator.

```tsx
import { withFireflyDecorator, initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    decorators: [
        withFireflyDecorator(runtime)
    ],
    parameters: {
        msw: {
            handlers: [...runtime.requestHandlers]
        }
    }
};
```

### withFeatureFlagsOverrideDecorator

Decorator for overriding feature flags in stories. Overrides the initial flag values while the story renders and restores them after.

```tsx
import { withFeatureFlagsOverrideDecorator, initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    featureFlags: {
        "feature-key": true
    }
});

const meta = {
    decorators: [
        withFireflyDecorator(runtime)
    ]
};

// Per-story override
export const WithFeatureDisabled = {
    decorators: [
        withFeatureFlagsOverrideDecorator({ "feature-key": false })
    ]
};
```

## Helper Functions

### isNavigationLink

Type guard to check if a navigation item is a link (not a section).

```tsx
import { isNavigationLink } from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key) => {
    if (!isNavigationLink(item)) {
        // It's a section
        return renderSection(item, key);
    }
    // It's a link
    const { label, linkProps, additionalProps } = item;
    return <Link {...linkProps}>{label}</Link>;
};
```

### isGlobalDataQueriesError

Type guard to check if an error is from global data queries.

```tsx
import { isGlobalDataQueriesError } from "@squide/firefly";

function ErrorBoundary() {
    const error = useRouteError();

    if (isGlobalDataQueriesError(error)) {
        // Handle data query error
        console.error(error.errors);
    }
}
```

### resolveRouteSegments

Resolve dynamic segments in a route path.

```tsx
import { resolveRouteSegments } from "@squide/firefly";

// Pattern: /users/:userId/posts/:postId
const path = resolveRouteSegments("/users/:userId/posts/:postId", {
    userId: "123",
    postId: "456"
});
// Result: /users/123/posts/456
```

### getFeatureFlag

Get a feature flag value in non-React code.

```tsx
import { getFeatureFlag } from "@squide/firefly";

// In bootstrapping code
const isEnabled = getFeatureFlag(launchDarklyClient, "feature-key", false);
```

### initializeFireflyForStorybook

Create a StorybookRuntime instance configured for Storybook.

```tsx
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    environmentVariables: { apiUrl: "https://mock.api" },
    featureFlags: { "my-feature": true },
    useMsw: true  // Default is true
});
```
