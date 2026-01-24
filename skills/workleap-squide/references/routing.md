# Routing API Reference

## Table of Contents

- [AppRouter](#approuter)
- [PublicRoutes and ProtectedRoutes](#publicroutes-and-protectedroutes)
- [useNavigationItems](#usenavigationitems)
- [useRenderedNavigationItems](#userenderednavigationitems)
- [useIsBootstrapping](#useisbootstrapping)
- [useRoutes](#useroutes)
- [isNavigationLink](#isnavigationlink)
- [Error Boundaries](#error-boundaries)

## AppRouter

A component that sets up Squide's primitives with React Router.

```tsx
<AppRouter
    waitForPublicData={boolean}
    waitForProtectedData={boolean}
>
    {({ rootRoute, registeredRoutes, routerProviderProps }) => ( ... )}
</AppRouter>
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `waitForPublicData` | `boolean` | `false` | Delay rendering until public data is ready |
| `waitForProtectedData` | `boolean` | `false` | Delay rendering until protected data is ready |
| `children` | `function` | required | Render function receiving route configuration |

### Children Function Arguments

- `rootRoute`: Root route element to wrap all routes
- `registeredRoutes`: Array of registered route objects
- `routerProviderProps`: Props to spread on RouterProvider

### Basic Example

```tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
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

### With Loading State

```tsx
import { AppRouter, useIsBootstrapping } from "@squide/firefly";
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

### With Error Boundary

```tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

export function App() {
    return (
        <AppRouter>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => (
                <RouterProvider
                    router={createBrowserRouter([{
                        element: rootRoute,
                        errorElement: <RootErrorBoundary />,
                        children: registeredRoutes
                    }])}
                    {...routerProviderProps}
                />
            )}
        </AppRouter>
    );
}
```

### Wait for Data

```tsx
// Wait for public data
<AppRouter waitForPublicData>
    {/* ... */}
</AppRouter>

// Wait for protected data
<AppRouter waitForProtectedData>
    {/* ... */}
</AppRouter>

// Wait for both
<AppRouter waitForPublicData waitForProtectedData>
    {/* ... */}
</AppRouter>
```

## PublicRoutes and ProtectedRoutes

Placeholder objects indicating where non-hoisted routes should be rendered.

```tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            PublicRoutes,   // Public routes render here
            ProtectedRoutes // Protected routes render here
        ]
    }, { hoist: true });
};
```

## useNavigationItems

Retrieve registered navigation items.

```ts
const items = useNavigationItems(options?: { menuId?: string });
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `menuId` | `string` | `"root"` | Menu identifier to retrieve items from |

### Example

```tsx
import { useNavigationItems } from "@squide/firefly";

function Navigation() {
    const navigationItems = useNavigationItems();
    // Returns items registered for "root" menu

    const sidebarItems = useNavigationItems({ menuId: "sidebar" });
    // Returns items registered for "sidebar" menu

    return (/* render items */);
}
```

## useRenderedNavigationItems

Transform navigation items into React elements.

```ts
const elements = useRenderedNavigationItems(
    navigationItems: NavigationItem[],
    renderItem: RenderItemFunction,
    renderSection: RenderSectionFunction
);
```

### Types

```ts
type RenderItemFunction = (
    item: NavigationLinkRenderProps | NavigationSectionRenderProps,
    key: string
) => ReactNode;

type RenderSectionFunction = (
    elements: ReactNode[],
    key: string
) => ReactNode;

interface NavigationLinkRenderProps {
    label: ReactNode;
    linkProps: { to: string; [key: string]: unknown };
    additionalProps: Record<string, unknown>;
    canRender: () => boolean;
}

interface NavigationSectionRenderProps {
    label: ReactNode;
    section: NavigationSection;
    additionalProps: Record<string, unknown>;
    canRender: () => boolean;
}
```

### Complete Example

```tsx
import { Link, Outlet } from "react-router";
import {
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key) => {
    // Check if should render
    if (!item.canRender()) {
        return null;
    }

    // Only render links (not sections at this level)
    if (!isNavigationLink(item)) {
        return null;
    }

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

export function RootLayout() {
    const navigationItems = useNavigationItems();
    const navigationElements = useRenderedNavigationItems(
        navigationItems,
        renderItem,
        renderSection
    );

    return (
        <>
            <nav>{navigationElements}</nav>
            <Outlet />
        </>
    );
}
```

### Render Dynamic Segments

For routes with dynamic segments (e.g., `/user/:userId`):

```tsx
const renderItem: RenderItemFunction = (item, key) => {
    if (!isNavigationLink(item)) return null;

    const { label, linkProps, additionalProps } = item;

    // Replace dynamic segment with actual value
    const to = linkProps.to.replace(":userId", currentUserId);

    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps} to={to}>
                {label}
            </Link>
        </li>
    );
};
```

## useIsBootstrapping

Check if the application is still bootstrapping.

```ts
const isBootstrapping = useIsBootstrapping();
```

Returns `true` when:
- MSW is being initialized (if enabled)
- Public data is loading (if `waitForPublicData` is true)
- Protected data is loading (if `waitForProtectedData` is true)

```tsx
import { useIsBootstrapping } from "@squide/firefly";
import { Outlet } from "react-router";

function BootstrappingRoute() {
    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```

## useRoutes

Retrieve all registered routes.

```ts
const routes = useRoutes();
```

## isNavigationLink

Type guard to check if a navigation item is a link.

```ts
import { isNavigationLink } from "@squide/firefly";

if (isNavigationLink(item)) {
    // item is NavigationLinkRenderProps
    console.log(item.linkProps.to);
} else {
    // item is NavigationSectionRenderProps
    console.log(item.section);
}
```

## Error Boundaries

### Root Error Boundary

```tsx
import { isGlobalDataQueriesError, useLogger } from "@squide/firefly";
import { useRouteError, isRouteErrorResponse, useLocation } from "react-router";
import { useEffect } from "react";

export function RootErrorBoundary() {
    const error = useRouteError() as Error;
    const location = useLocation();
    const logger = useLogger();

    useEffect(() => {
        if (isRouteErrorResponse(error)) {
            logger.error(`Route error ${error.status}: ${error.statusText}`);
        } else if (isGlobalDataQueriesError(error)) {
            logger.error(`Data query error: ${error.message}`);
        } else {
            logger.error(`Unhandled error: ${error.message}`);
        }
    }, [error, location.pathname, logger]);

    return (
        <div>
            <h2>Unmanaged error</h2>
            <p>An error occurred. Please refresh your browser.</p>
        </div>
    );
}
```

### Module Error Boundary

Isolate module failures from the entire application:

```tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";
import { ModuleErrorBoundary } from "./ModuleErrorBoundary.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [{
            errorElement: <ModuleErrorBoundary />,
            children: [PublicRoutes, ProtectedRoutes]
        }]
    }, { hoist: true });
};
```

### Route-Specific Error Boundary

```tsx
runtime.registerRoute({
    path: "/page",
    element: <Page />,
    errorElement: <PageErrorBoundary />
});
```

## Route Registration Patterns

### Basic Protected Route

```tsx
runtime.registerRoute({
    path: "/dashboard",
    element: <Dashboard />
});
// Renders under ProtectedRoutes placeholder
```

### Public Route

```tsx
runtime.registerPublicRoute({
    path: "/login",
    element: <LoginPage />
});
// Renders under PublicRoutes placeholder
```

### Hoisted Route

```tsx
runtime.registerRoute({
    path: "/standalone",
    element: <StandalonePage />,
    errorElement: <StandaloneError /> // Recommended for hoisted routes
}, { hoist: true });
// Renders at router root, outside all layouts
```

### Nested Route by Path

```tsx
runtime.registerRoute({
    path: "/settings/profile",
    element: <ProfileSettings />
}, { parentPath: "/settings" });
```

### Nested Route by ID

```tsx
// Parent with ID
runtime.registerRoute({
    $id: "settings-layout",
    path: "/settings",
    element: <SettingsLayout />
});

// Child referencing parent ID
runtime.registerRoute({
    path: "/settings/profile",
    element: <ProfileSettings />
}, { parentId: "settings-layout" });
```

### Not Found Route

```tsx
runtime.registerPublicRoute({
    path: "*",
    element: <NotFoundPage />
});
```

### Index Route

```tsx
runtime.registerRoute({
    index: true,
    element: <HomePage />
});
```
