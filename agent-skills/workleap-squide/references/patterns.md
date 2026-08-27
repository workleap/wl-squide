# Squide Patterns and Best Practices

## Table of Contents
- [Application Structure](#application-structure)
- [Module Registration Patterns](#module-registration-patterns)
- [Navigation Patterns](#navigation-patterns)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Authentication Patterns](#authentication-patterns)
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
        "@opentelemetry/api": "^x.x.x",
        "@squide/firefly": "^x.x.x",
        "@tanstack/react-query": "^x.x.x",
        "launchdarkly-js-client-sdk": "^x.x.x",
        "msw": "^x.x.x",
        "react": "^x.x.x",
        "react-dom": "^x.x.x",
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

> For MSW initialization, browser setup, and handler file structure, see `references/integrations.md`.

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

### Every Deferred Run Registers the Full Set

A deferred registration function is not executed once. It runs again every time the deferred registrations are updated — whenever a feature flag value changes or the data passed to `useDeferredRegistrations` changes. Squide discards everything the previous run registered before replaying the new one, so **every run must register the full set of navigation items it wants rendered, not the difference since the last run.**

```ts
export const register: ModuleRegisterFunction<FireflyRuntime> = () => {
    return deferredRuntime => {
        // Re-evaluated and re-registered on every run.
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

### Missing Sections Are Reported

When a nested navigation item is registered with a `sectionId` that no registered section matches, the item is held as a **pending registration** and is not rendered. Squide reports the sections that are still missing once the modules are ready — throwing in development and logging in production.

This surfaces a `sectionId` that no module registers at bootstrap. It does **not** cover deferred registration update runs — the validation runs only once, when the modules become ready, so a section dropped by a later update run goes unreported until a page reload. A module that registers a section conditionally, and expects to keep it across update runs, typically resets its per-run state on `DeferredRegistrationsUpdateStartedEvent` (see [Testing Deferred Registrations](#testing-deferred-registrations)). Set `strictMode` to `false` on `AppRouter` to turn the validation off — see `references/components.md`.

## Navigation Patterns

- [Multi-Level Navigation](#multi-level-navigation)
- [Nested Registration](#nested-registration-cross-module)
- [Multiple Menus](#multiple-menus)
- [Modular Tabs](#modular-tabs)
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

### Modular Tabs

To render a page whose tabs are owned by different modules, combine a nested layout with a dedicated menu. The host registers the layout at a path (`/tabs`) and renders the menu scoped to a `menuId`; each module registers its tab route under `parentPath` and its tab header in that menu. No module holds a hard reference to another, and every tab gets its own URL.

```tsx
// host: the nested layout renders the tab headers and the active tab
import { useNavigationItems, useRenderedNavigationItems } from "@squide/firefly";
import { Suspense } from "react";
import { Outlet } from "react-router";

export function TabsLayout() {
    const navigationItems = useNavigationItems({ menuId: "/tabs" });
    const renderedTabs = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <div>
            {renderedTabs}
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </div>
    );
}

// host/src/register.tsx
runtime.registerRoute({ path: "/tabs", element: <TabsLayout /> });
```

```tsx
// module 1: the default tab uses "index: true" instead of a path
runtime.registerRoute({
    index: true,
    element: <Tab1 />
}, { parentPath: "/tabs" });

runtime.registerNavigationItem({
    $id: "tab-1",
    $label: "Tab 1",
    to: "/tabs"
}, { menuId: "/tabs" });
```

```tsx
// module 2: nested route paths must start with the parent layout path
runtime.registerRoute({
    path: "/tabs/tab-2",
    element: <Tab2 />
}, { parentPath: "/tabs" });

runtime.registerNavigationItem({
    $id: "tab-2",
    $label: "Tab 2",
    to: "/tabs/tab-2"
}, { menuId: "/tabs" });
```

Use `$priority` to control the tab order (highest first).

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

`$priority` orders an item among its siblings at **any** depth, not only at the top level of a menu.
Items without one, or with equal ones, keep their declaration order. The value is also forwarded to the
layout as the `priority` render prop. See `references/runtime-api.md`.

Nothing is required of the layout to get a sorted menu, and pre-sorting the items before handing them to
`useRenderedNavigationItems` accomplishes nothing: the hook sorts every array it receives, so a caller's
order is discarded and only ties survive. Do not suggest a recursive sort helper for this.

An order that contradicts `$priority` can only be had by removing `$priority` from the tree that is handed
over, or by not using this hook. That is a deliberate escape hatch, not a normal pattern.

`$priority` is optional, so default it when comparing the `priority` render prop inside a renderer:
`(y.priority ?? 0) - (x.priority ?? 0)`.

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

## Authentication Patterns

Squide has no built-in authentication primitives; it provides a recipe. The pieces fit together as follows:

1. Fetch the session with `useProtectedDataQueries` and an `isUnauthorizedError` handler so a `401` renders the page immediately instead of throwing to an error boundary.
2. Share the session through a context, and expose a `SessionManager` so components can clear it on logout.
3. Register a pathless `AuthenticationBoundary` route that redirects unauthenticated users to the login page.
4. Register the login page and the not-found page as **public** routes so they render outside the boundary.

### Authentication Boundary

```tsx
import { Navigate, Outlet } from "react-router";
import { useIsAuthenticated } from "@sample/shared";

export function AuthenticationBoundary() {
    const isAuthenticated = useIsAuthenticated();

    if (isAuthenticated) {
        return <Outlet />;
    }

    return <Navigate to="/login" />;
}
```

### Route Assembly

Public routes render before the boundary; protected routes render inside it, under an authenticated layout. The route holding the `PublicRoutes` and `ProtectedRoutes` placeholders must be hoisted, otherwise the placeholders render within themselves and loop forever.

```tsx
runtime.registerRoute({
    element: <RootLayout />,
    children: [
        // All the public routes render before the authenticated layout.
        PublicRoutes,
        {
            // Everything beyond the boundary is protected.
            element: <AuthenticationBoundary />,
            children: [{
                element: <AuthenticatedLayout />,
                children: [ProtectedRoutes]
            }]
        }
    ]
}, {
    hoist: true
});

runtime.registerPublicRoute({ path: "/login", element: <LoginPage /> });
runtime.registerPublicRoute({ path: "*", element: <NotFoundPage /> });
```

### Session Manager

Expose a shared `SessionManager` interface (`getSession()` / `clearSession()`) so a logout can invalidate the session query, then share the instance through a context created in the `BootstrappingRoute`.

```tsx
class TanstackQuerySessionManager implements SessionManager {
    #session: Session | undefined;
    readonly #queryClient: QueryClient;

    constructor(session: Session, queryClient: QueryClient) {
        this.#session = session;
        this.#queryClient = queryClient;
    }

    getSession() {
        return this.#session;
    }

    clearSession() {
        this.#session = undefined;
        this.#queryClient.invalidateQueries({ queryKey: ["/api/session"], refetchType: "inactive" });
    }
}
```

**Important:** after a login, reload the application (`window.location.href = "/"`) rather than navigating — `AppRouter` requires a full refresh to re-run the bootstrapping flow.

### Fake Session Managers (`@squide/fakes`)

For development and MSW handlers only — never in production code.

```ts
import { LocalStorageSessionManager, ReadonlySessionLocalStorage } from "@squide/fakes";

// Read/write: use it in MSW login, logout and session handlers.
const sessionManager = new LocalStorageSessionManager<Session>();
sessionManager.setSession({ username: "temp" });
sessionManager.getSession();
sessionManager.clearSession();

// Read-only accessor over the same local storage session.
const sessionAccessor = new ReadonlySessionLocalStorage<Session>();
sessionAccessor.getSession();
```

Both constructors accept an optional `{ key }` option to override the `localStorage` key.

## Error Boundary Patterns

> Error boundaries are critical in modular applications where one module's failure shouldn't break the entire app. See also `references/components.md` for the `isGlobalDataQueriesError` helper.

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

> For Storybook-based testing with `initializeFireflyForStorybook`, see `references/integrations.md` and `references/components.md`.

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

### Testing Deferred Registrations

`createDeferredRegistrationsRunner` (from `@squide/firefly/testing`) executes deferred registration functions through the same sequence as a real application. Use it instead of hand-rolling a harness around the module registry.

```ts
import { createDeferredRegistrationsRunner } from "@squide/firefly/testing";
import { EnvironmentVariablesPlugin, FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";

const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredData> = () => {
    return (deferredRuntime, data) => {
        if (data.isBillingEnabled) {
            deferredRuntime.registerNavigationItem({ $id: "billing", $label: "Billing", to: "/billing" });
        }
    };
};

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x)]
});

const runner = createDeferredRegistrationsRunner(runtime, [register], {
    context: { host: "sample" }   // Optional, forwarded to the module registration functions
});

// Registration run: can only be called once. Resolves to an array of ModuleRegistrationError.
await runner.register({ isBillingEnabled: true });
expect(runtime.getNavigationItems().length).toBe(1);

// Update run: must follow "register". Drops the previous run's deferred items and replays the current run.
await runner.update({ isBillingEnabled: false });
expect(runtime.getNavigationItems().length).toBe(0);
```

**Signature:** `createDeferredRegistrationsRunner(runtime, localModules, options?: { context? })`, returning `{ register(data?), update(data?) }`. Both resolve to an array of `ModuleRegistrationError` — errors are collected, not thrown.

**A runner takes a runtime rather than creating one.** `initializeFirefly` cannot be used in tests because it can only run once per process. Construct the runtime with the plugins the modules under test depend on: `initializeFirefly` always registers an `EnvironmentVariablesPlugin`, so a module calling `registerEnvironmentVariable` or `getEnvironmentVariable` fails against a plugin-less runtime.

An update run reproduces everything `useDeferredRegistrations` does around it, because modules and plugins rely on those events to reset their per-run state:

1. `DeferredRegistrationsUpdateStartedEvent` is dispatched.
2. The deferred registration functions are executed.
3. The app router store `deferredRegistrationsUpdatedAt` value is updated and `DeferredRegistrationsUpdatedEvent` is dispatched.
4. `DeferredRegistrationsUpdateCompletedEvent` is dispatched.

A module keeping state across runs typically resets it on the started event, so it behaves in a test exactly as it does at runtime:

```ts
import { DeferredRegistrationsUpdateStartedEvent } from "@squide/firefly";

const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredData> = runtime => {
    const registeredSections = new Set<string>();

    runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => registeredSections.clear());

    return (deferredRuntime, data) => {
        if (!registeredSections.has("billing")) {
            registeredSections.add("billing");
            deferredRuntime.registerNavigationItem({ $id: "billing", $label: "Billing", children: [] });
        }

        deferredRuntime.registerNavigationItem({ $id: "invoices", $label: "Invoices", to: "/invoices" }, { sectionId: "billing" });
    };
};
```

Provide every module participating in a scenario — they all execute within the same run. To test a standalone deferred registration function, wrap it in a module registration function: `createDeferredRegistrationsRunner(runtime, [() => registerBillingNavigationItems])`.

**Caveats:**
- A runner is for tests only. It does not notify React that the registrations changed, so an application driven by a runner renders stale navigation items — use `useDeferredRegistrations` at runtime.
- A runner dispatches the update events itself, standing in for `useDeferredRegistrations`. Such a test asserts that a module *reacts* to those events, not that they are dispatched at runtime (Squide covers that half).
- Assert on the navigation items rather than calling `runtime._validateRegistrations()`. Items registered under a section that no longer exists are parked as pending rather than rejected, so a run that lost a section still resolves without errors:

```ts
await runner.register({ isBillingEnabled: true });
await runner.update({ isBillingEnabled: true });

expect(runtime.getNavigationItems()).toMatchObject([{ $id: "billing", children: [{ $id: "invoices" }] }]);
```

  `_validateRegistrations()` validates routes first, and routes registered without an explicit parent default to the `PublicRoutes`/`ProtectedRoutes` outlets, which a runner never registers. Against a headless runtime it therefore throws `The ProtectedRoutes outlet is missing from the router configuration` for any module registering a route, whatever the state of the navigation items.

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
