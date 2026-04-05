---
name: workleap-squide
description: |
  Squide (@squide/firefly) — Workleap's React modular application shell. Use when:
  (1) Working with FireflyRuntime, initializeFirefly, AppRouter, or FireflyProvider
  (2) Creating or modifying Squide host applications or modules
  (3) Registering routes, navigation items, or MSW request handlers
  (4) Squide integrations with TanStack Query, i18next, LaunchDarkly, Honeycomb, MSW, or Storybook
  (5) Deferred registrations or conditional navigation items
  (6) Global data fetching: usePublicDataQueries, useProtectedDataQueries
  (7) Squide hooks for event bus, environment variables, feature flags, logging, or bootstrapping state
  (8) Error boundaries or modular architecture in Squide applications
metadata:
  version: 1.11
---

# Squide Framework

Squide is a React modular application shell. Use only documented APIs.

## Core Concepts

- **Runtime**: The `FireflyRuntime` instance is the backbone of a Squide application. Never instantiate directly — use `initializeFirefly()`, which wires up plugins, logging, and the module lifecycle.
- **Modular Registration**: Modules register routes, navigation items, and MSW handlers via a registration function, assembled by the host at bootstrapping.
- **Public vs Protected Routes**: Routes default to `protected` (rendered under `ProtectedRoutes`). Use `registerPublicRoute()` for public routes. Protected routes fetch both public and protected global data.
- **Deferred Registrations**: Navigation items dependent on remote data or feature flags use two-phase registration — return a function from the registration to defer items to a second phase.

## Key Patterns

### Host Application Setup

```tsx
// host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost]
});

const queryClient = new QueryClient();
const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </FireflyProvider>
);
```

```tsx
// host/src/App.tsx
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
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => (
                <RouterProvider
                    router={createBrowserRouter([{
                        element: rootRoute,
                        children: [{
                            element: <BootstrappingRoute />,
                            children: registeredRoutes
                        }]
                    }], routerProps)}
                    {...routerProviderProps}
                />
            )}
        </AppRouter>
    );
}
```

```tsx
// host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [PublicRoutes, ProtectedRoutes]
    }, { hoist: true });

    // HomePage and NotFoundPage are local page components
    runtime.registerRoute({ index: true, element: <HomePage /> });
    runtime.registerPublicRoute({ path: "*", element: <NotFoundPage /> });
};
```

### Navigation Rendering

**Important:** `RenderItemFunction` signature is `(item, key, index, level) => ReactNode` and `RenderSectionFunction` is `(elements, key, index, level) => ReactNode`. These signatures are fixed and do not accept custom context parameters, but there could be fewer arguments. Use closures to access external values.

```tsx
import { Link, Outlet } from "react-router";
import {
    useNavigationItems, useRenderedNavigationItems, isNavigationLink,
    type RenderItemFunction, type RenderSectionFunction
} from "@squide/firefly";

// Signature: (item, key, index, level) => ReactNode
const renderItem: RenderItemFunction = (item, key, index, level) => {
    if (!isNavigationLink(item)) return null;
    const { label, linkProps, additionalProps } = item;
    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>{label}</Link>
        </li>
    );
};

// Signature: (elements, key, index, level) => ReactNode
const renderSection: RenderSectionFunction = (elements, key, index, level) => (
    <ul key={key}>{elements}</ul>
);

export function RootLayout() {
    const navigationItems = useNavigationItems();
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);
    return (
        <>
            <nav>{navigationElements}</nav>
            <Outlet />
        </>
    );
}
```

### Global Data Fetching

```tsx
// Protected data
import { useProtectedDataQueries, useIsBootstrapping, AppRouter } from "@squide/firefly";

// ApiError and isApiError are app-specific; define them to match your API's error shape
function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([{
        queryKey: ["/api/session"],
        queryFn: async () => {
            const response = await fetch("/api/session");
            if (!response.ok) throw new ApiError(response.status);
            return response.json();
        }
    }], error => isApiError(error) && error.status === 401);

    if (useIsBootstrapping()) return <div>Loading...</div>;

    return (
        <SessionContext.Provider value={session}>
            <Outlet />
        </SessionContext.Provider>
    );
}

// In App component, set waitForProtectedData
<AppRouter waitForProtectedData>...</AppRouter>
```

```tsx
// Public data
const [data] = usePublicDataQueries([{ queryKey: [...], queryFn: ... }]);
<AppRouter waitForPublicData>...</AppRouter>
```

### Deferred Navigation Items

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Always register routes
    runtime.registerRoute({ path: "/feature", element: <FeaturePage /> });

    // Return function for deferred navigation items
    return (deferredRuntime, { userData }) => {
        if (userData.isAdmin && deferredRuntime.getFeatureFlag("enable-feature")) {
            deferredRuntime.registerNavigationItem({
                $id: "feature",
                $label: "Feature",
                to: "/feature"
            });
        }
    };
};
```

```tsx
// Execute deferred registrations in BootstrappingRoute.
// Wrap in useMemo — without it, a new object reference each render re-triggers all deferred registrations.
const data = useMemo(() => ({ userData }), [userData]);
useDeferredRegistrations(data);
```

**See also:** For error boundaries, testing patterns, and advanced navigation (multi-level, dynamic segments, active state), see `references/patterns.md`. For MSW setup, LaunchDarkly, Honeycomb, i18next, and Storybook integrations, see `references/integrations.md`. For plugin authoring and the full runtime API, see `references/runtime-api.md`.

## Reference Guide

For detailed API documentation beyond the patterns above, consult the reference files:

- **`references/runtime-api.md`** — `initializeFirefly` options, route registration options (`hoist`, `parentPath`, `parentId`), route properties, navigation item properties, and navigation registration options (`menuId`, `sectionId`)
- **`references/hooks-api.md`** — All Squide hooks: data fetching (`usePublicDataQueries`, `useProtectedDataQueries`), navigation, event bus, environment variables, feature flags, logging, routing, and i18next hooks
- **`references/components.md`** — `AppRouter` props, `FireflyProvider`, helper functions (`isNavigationLink`, `resolveRouteSegments`, `mergeDeferredRegistrations`)
- **`references/patterns.md`** — Local module setup, error boundaries, MSW request handlers, and other common patterns
- **`references/integrations.md`** — LaunchDarkly (plugin, utilities, testing clients), Honeycomb, i18next, and Storybook integration details

## Common Pitfalls

> **Skill maintainers:** Before updating this skill, read [ODR-0008](../../agent-docs/odr/0008-skill-body-reference-split.md). The body must stay under ~250 lines; new API content goes in the appropriate `references/` file.

When working with Squide APIs, watch for these common mistakes:

1. **`useRenderedNavigationItems` function signatures**: Must always be `(item, key, index, level)` and `(elements, key, index, level)`. These do NOT accept custom context parameters. If external values are needed (route params, location, etc.), use closures or React hooks - never suggest adding parameters to these functions.

2. **Active state styling**: Use React Router's `NavLink` and its `isActive` argument provided to the `className`/`style` render functions (for example, `className={({ isActive }) => ... }`). Do not suggest passing location/pathname as a context parameter.

3. **Dynamic route segments**: Use the `resolveRouteSegments` helper with closures to capture values like `userId`. Example pattern: create a higher-order function that returns a `RenderItemFunction`.

4. **Deferred registration runtime parameter**: The deferred registration callback receives `deferredRuntime` as its first argument — this is NOT the same `runtime` from the outer registration function. Always use `deferredRuntime` inside the deferred callback for `registerNavigationItem`, `getFeatureFlag`, etc.
