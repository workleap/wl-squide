# Squide Patterns and Best Practices

## Table of Contents
- [Application Structure](#application-structure)
- [Module Registration Patterns](#module-registration-patterns)
- [Navigation Patterns](#navigation-patterns)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Error Boundary Patterns](#error-boundary-patterns)
- [Testing Patterns](#testing-patterns)
- [Common Pitfalls](#common-pitfalls)

## Application Structure

### Recommended Monorepo Structure

```
monorepo/
├── apps/
│   ├── host/              # Main application shell
│   └── storybook/         # Storybook application
├── packages/
│   ├── components/        # Shared components
│   └── core/              # Everything else that is shared
├── modules/
│   ├── user-profile/      # User profile module
│   ├── checkout/          # Checkout module
│   └── inventory/         # Inventory module
```

### Module Package Structure

```
module-name/
├── src/
│   ├── register.tsx       # Module registration
│   ├── Page.tsx           # Page components
│   └── mocks/
│       └── handlers.ts    # MSW handlers
├── package.json
└── tsconfig.json
```

### Module package.json

```json
{
    "name": "@my-app/module-name",
    "version": "0.0.1",
    "type": "module",
    "exports": "./src/register.tsx",
    "peerDependencies": {
        "@squide/firefly": "^x.x.x",
        "@tanstack/react-query": "^x.x.x",
        "react": "^x.x.x",
        "react-router": "^x.x.x"
    }
}
```

## Module Registration Patterns

### Basic Registration

```tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/feature",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "feature",
        $label: "Feature",
        to: "/feature"
    });
};
```

### With MSW Handlers

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    runtime.registerRoute({
        path: "/feature",
        element: <Page />
    });

    // Dynamic import to avoid bundling MSW in production
    if (runtime.isMswEnabled) {
        const { requestHandlers } = await import("./mocks/handlers.ts");
        runtime.registerRequestHandlers(requestHandlers);
    }
};
```

### Higher-Order Registration (with options)

```tsx
export interface RegisterOptions {
    env: "dev" | "staging" | "production";
}

export function register(options: RegisterOptions) {
    const fct: ModuleRegisterFunction<FireflyRuntime> = runtime => {
        if (options.env !== "production") {
            runtime.registerRoute({
                path: "/debug",
                element: <DebugPage />
            });
        }
    };
    return fct;
}
```

### Deferred Registration (conditional nav items)

```tsx
interface DeferredData {
    user: { isAdmin: boolean };
}

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredData> = runtime => {
    // Always register routes
    runtime.registerRoute({
        path: "/admin",
        element: <AdminPage />
    });

    // Defer navigation item registration
    return (deferredRuntime, { user }) => {
        if (user.isAdmin && deferredRuntime.getFeatureFlag("admin-panel")) {
            deferredRuntime.registerNavigationItem({
                $id: "admin",
                $label: "Admin",
                to: "/admin"
            });
        }
    };
};
```

## Navigation Patterns

- [Multi-Level Navigation](#multi-level-navigation)
- [Nested Registration](#nested-registration-cross-module)
- [Multiple Menus](#multiple-menus)
- [Sorting with Priority](#sorting-with-priority)
- [Active State Styling](#active-state-styling)
- [Dynamic Route Segments](#dynamic-route-segments)

### Multi-Level Navigation

```tsx
runtime.registerNavigationItem({
    $id: "settings",
    $label: "Settings",
    children: [
        {
            $id: "settings-profile",
            $label: "Profile",
            to: "/settings/profile"
        },
        {
            $id: "settings-security",
            $label: "Security",
            to: "/settings/security"
        }
    ]
});
```

### Nested Registration (cross-module)

```tsx
// Module A registers section
runtime.registerNavigationItem({
    $id: "admin-section",
    $label: "Administration"
});

// Module B nests under section
runtime.registerNavigationItem({
    $id: "users",
    $label: "Users",
    to: "/admin/users"
}, {
    sectionId: "admin-section"
});
```

### Multiple Menus

```tsx
// Define secondary menu in layout
const sidebarItems = useNavigationItems({ menuId: "sidebar" });

// Register to specific menu
runtime.registerNavigationItem({
    $id: "help",
    $label: "Help",
    to: "/help"
}, {
    menuId: "sidebar"
});
```

### Sorting with Priority

```tsx
// Higher priority = appears first
runtime.registerNavigationItem({
    $id: "home",
    $label: "Home",
    $priority: 100,  // Will appear first
    to: "/"
});

runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    $priority: 10,   // Will appear after home
    to: "/about"
});
```

### Active State Styling

Use React Router's `NavLink` component for automatic active state handling:

```tsx
import { NavLink } from "react-router";
import {
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key, index, level) => {
    if (!isNavigationLink(item)) return null;
    const { label, linkProps, additionalProps } = item;

    return (
        <li key={key}>
            <NavLink
                {...linkProps}
                {...additionalProps}
                className={({ isActive }) => isActive ? "nav-active" : "nav-link"}
            >
                {label}
            </NavLink>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key, index, level) => (
    <ul key={key}>{elements}</ul>
);

export function RootLayout() {
    const navigationItems = useNavigationItems();
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <nav>{navigationElements}</nav>
    );
}
```

### Dynamic Route Segments

The `to` option can include dynamic segments (`/users/:userId/profile`). Use a closure to capture external values like route params, then resolve with `resolveRouteSegments`.

```tsx
// Register with dynamic segment
runtime.registerNavigationItem({
    $id: "user-profile",
    $label: "Profile",
    to: "/users/:userId/profile"
}, { menuId: "user-menu" });
```

```tsx
// Resolve in renderer using a closure to capture userId
import { useParams, Link } from "react-router";
import {
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    resolveRouteSegments,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

// Higher-order function creates a RenderItemFunction with access to userId
function createRenderItem(userId: string): RenderItemFunction {
    return (item, key, index, level) => {
        if (!isNavigationLink(item)) return null;
        const { label, linkProps, additionalProps } = item;
        const { to, ...rest } = linkProps;

        return (
            <li key={key}>
                <Link to={resolveRouteSegments(to as string, { userId })} {...rest} {...additionalProps}>
                    {label}
                </Link>
            </li>
        );
    };
}

const renderSection: RenderSectionFunction = (elements, key, index, level) => (
    <ul key={key}>{elements}</ul>
);

export function UserProfileLayout() {
    const { userId } = useParams();
    const navigationItems = useNavigationItems({ menuId: "user-menu" });
    // Pass the closure-generated function
    const navigationElements = useRenderedNavigationItems(navigationItems, createRenderItem(userId!), renderSection);

    return <nav>{navigationElements}</nav>;
}
```

**Important:** The hook calls `RenderItemFunction` and `RenderSectionFunction` with `(item, key, index, level)` and `(elements, key, index, level)` respectively. Implementations may declare fewer parameters (for example `(item, key)`) and ignore the extra arguments, but they must not add additional custom context parameters. Use closures or React hooks to access external values instead.

## Data Fetching Patterns

### Global Data with Context

```tsx
// Define shared context
export const SessionContext = createContext<Session | undefined>(undefined);
export const useSession = () => useContext(SessionContext);

// In BootstrappingRoute
function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([sessionQuery], is401Error);

    if (useIsBootstrapping()) return <Loading />;

    return (
        <SessionContext.Provider value={session}>
            <Outlet />
        </SessionContext.Provider>
    );
}

// Use in any component
function UserMenu() {
    const session = useSession();
    return <span>{session?.user.name}</span>;
}
```

### Page Data with Suspense

```tsx
// Layout with Suspense boundary
export function RootLayout() {
    return (
        <>
            <Header />
            <Suspense fallback={<PageSkeleton />}>
                <Outlet />
            </Suspense>
        </>
    );
}

// Page with useSuspenseQuery
function ProductPage() {
    const { productId } = useParams();
    const { data } = useSuspenseQuery({
        queryKey: ["product", productId],
        queryFn: () => fetchProduct(productId)
    });

    return <ProductDetails product={data} />;
}
```

### Combining Public and Protected Data

```tsx
function BootstrappingRoute() {
    const [config] = usePublicDataQueries([configQuery]);
    const [session] = useProtectedDataQueries([sessionQuery], is401Error);

    const deferredData = useMemo(() => ({
        user: session?.user
    }), [session]);

    useDeferredRegistrations(deferredData);

    if (useIsBootstrapping()) return <Loading />;

    return (
        <ConfigContext.Provider value={config}>
            <SessionContext.Provider value={session}>
                <Outlet />
            </SessionContext.Provider>
        </ConfigContext.Provider>
    );
}

// App
<AppRouter waitForPublicData waitForProtectedData>
```

## Error Boundary Patterns

### Layered Error Boundaries

```tsx
// 1. Root error boundary - catches everything
runtime.registerRoute({
    errorElement: <RootErrorBoundary />,
    children: [{
        // 2. Layout preserving boundary
        element: <RootLayout />,
        children: [{
            // 3. Module-level boundary - preserves layout
            errorElement: <ModuleErrorBoundary />,
            children: [PublicRoutes, ProtectedRoutes]
        }]
    }]
}, { hoist: true });
```

### Error Boundary Implementation

```tsx
import { isGlobalDataQueriesError, useLogger } from "@squide/firefly";
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ModuleErrorBoundary() {
    const error = useRouteError();
    const logger = useLogger();

    useEffect(() => {
        if (isRouteErrorResponse(error)) {
            logger.error(`Route error: ${error.status}`);
        } else if (isGlobalDataQueriesError(error)) {
            logger.error("Data fetch error", error.errors);
        } else {
            logger.error("Unknown error", error);
        }
    }, [error]);

    return (
        <div>
            <h2>Something went wrong</h2>
            <p>The page encountered an error but you can continue using the app.</p>
            <Link to="/">Go Home</Link>
        </div>
    );
}
```

## Testing Patterns

### Unit Testing with FireflyRuntime

```tsx
import { FireflyProvider, FireflyRuntime, EnvironmentVariablesPlugin } from "@squide/firefly";
import { renderHook } from "@testing-library/react";

test("hook uses environment variable", () => {
    const runtime = new FireflyRuntime({
        plugins: [x => new EnvironmentVariablesPlugin(x, {
            variables: { apiUrl: "https://test.api" }
        })]
    });

    const { result } = renderHook(() => useMyHook(), {
        wrapper: ({ children }) => (
            <FireflyProvider runtime={runtime}>
                {children}
            </FireflyProvider>
        )
    });

    expect(result.current.apiUrl).toBe("https://test.api");
});
```

### Testing with Feature Flags

```tsx
import { InMemoryLaunchDarklyClient, LaunchDarklyPlugin, FireflyProvider, FireflyRuntime } from "@squide/firefly";

test("feature is hidden when flag is off", () => {
    const featureFlags = { "show-feature": false };
    const ldClient = new InMemoryLaunchDarklyClient(featureFlags);

    const runtime = new FireflyRuntime({
        plugins: [x => new LaunchDarklyPlugin(x, ldClient)]
    });

    render(
        <FireflyProvider runtime={runtime}>
            <FeatureComponent />
        </FireflyProvider>
    );

    expect(screen.queryByTestId("feature")).not.toBeInTheDocument();
});
```

## Common Pitfalls

### 1. Forgetting to use deferredRuntime

```tsx
// WRONG - uses root runtime
return (deferredRuntime, { user }) => {
    if (user.isAdmin) {
        runtime.registerNavigationItem({ ... }); // Won't update!
    }
};

// CORRECT - uses deferredRuntime
return (deferredRuntime, { user }) => {
    if (user.isAdmin) {
        deferredRuntime.registerNavigationItem({ ... });
    }
};
```

### 2. Missing useMemo for deferred data

```tsx
// WRONG - object reference changes every render
const data = { userData };
useDeferredRegistrations(data); // Re-runs registrations unnecessarily

// CORRECT - stable reference
const data = useMemo(() => ({ userData }), [userData]);
useDeferredRegistrations(data);
```

### 3. Bundling MSW in production

```tsx
// WRONG - imports MSW unconditionally
import { requestHandlers } from "./mocks/handlers";
if (runtime.isMswEnabled) {
    runtime.registerRequestHandlers(requestHandlers);
}

// CORRECT - dynamic import
if (runtime.isMswEnabled) {
    const { requestHandlers } = await import("./mocks/handlers");
    runtime.registerRequestHandlers(requestHandlers);
}
```

### 4. Missing $id on navigation items

```tsx
// WRONG - no $id causes flickering on updates
runtime.registerNavigationItem({
    $label: "Page",
    to: "/page"
});

// CORRECT - stable $id
runtime.registerNavigationItem({
    $id: "page",
    $label: "Page",
    to: "/page"
});
```

### 5. Not handling 401 in protected queries

```tsx
// WRONG - 401 errors unhandled
const [session] = useProtectedDataQueries([sessionQuery]);

// CORRECT - handle 401 for redirect
const [session] = useProtectedDataQueries(
    [sessionQuery],
    error => isApiError(error) && error.status === 401
);
```

### 6. Relative paths in nested routes

```tsx
// WRONG - relative path with parentPath
runtime.registerRoute({
    path: "page",  // Relative
    element: <Page />
}, { parentPath: "/layout" });

// CORRECT - absolute path
runtime.registerRoute({
    path: "/layout/page",  // Absolute
    element: <Page />
}, { parentPath: "/layout" });
```

### 7. Hoisted routes without error boundaries

```tsx
// WRONG - hoisted route can break entire app
runtime.registerRoute({
    path: "/standalone",
    element: <StandalonePage />
}, { hoist: true });

// CORRECT - includes error boundary
runtime.registerRoute({
    path: "/standalone",
    element: <StandalonePage />,
    errorElement: <StandaloneErrorBoundary />
}, { hoist: true });
```
