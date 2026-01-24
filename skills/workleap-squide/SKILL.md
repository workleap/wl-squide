---
name: workleap-squide
description: |
  Squide is a React modular application shell for Workleap web applications. Use this skill when:
  (1) Creating or modifying Squide host applications or modules
  (2) Registering routes, navigation items, or MSW request handlers
  (3) Working with FireflyRuntime, initializeFirefly, or AppRouter
  (4) Setting up integrations: TanStack Query, i18next, LaunchDarkly, Honeycomb, MSW, Storybook
  (5) Implementing deferred registrations or conditional navigation items
  (6) Fetching global public/protected data with usePublicDataQueries/useProtectedDataQueries
  (7) Using Squide hooks: useNavigationItems, useRenderedNavigationItems, useIsBootstrapping, useLogger, useEventBusListener, useEventBusDispatcher, useEnvironmentVariable, useFeatureFlag
  (8) Implementing error boundaries in modular applications
  (9) Questions about modular architecture patterns in React applications
---

# Squide

Squide is a React modular application shell that enforces architectural patterns for scalable, maintainable web applications. It organizes applications as collections of independent modules, each responsible for a specific domain.

## Modular Design Principles

- A module should correspond to a domain or subdomain
- Modules should be autonomous and self-contained
- Modules should NOT directly reference other modules - use Squide's Runtime API instead
- Data and state should NEVER be shared between modules

## Quick Start

### Host Application Setup

```tsx
// host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHost } from "./register.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
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

```tsx
// host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";
import { HomePage } from "./HomePage.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [PublicRoutes, ProtectedRoutes]
    }, { hoist: true });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });
};
```

### Local Module Setup

```tsx
// local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "page",
        $label: "Page",
        to: "/page"
    });

    // Optional: Register MSW handlers in development
    if (runtime.isMswEnabled) {
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;
        runtime.registerRequestHandlers(requestHandlers);
    }
};
```

## Core Concepts

### Route Registration

```tsx
// Basic route
runtime.registerRoute({
    path: "/page",
    element: <Page />
});

// Public route (no authentication required)
runtime.registerPublicRoute({
    path: "/login",
    element: <LoginPage />
});

// Hoisted route (renders outside root layout)
runtime.registerRoute({
    path: "/standalone",
    element: <StandalonePage />
}, { hoist: true });

// Nested route
runtime.registerRoute({
    path: "/parent/child",
    element: <ChildPage />
}, { parentPath: "/parent" });
```

### Navigation Items

```tsx
// Basic navigation item
runtime.registerNavigationItem({
    $id: "page",
    $label: "Page",
    to: "/page"
});

// With priority (higher renders first)
runtime.registerNavigationItem({
    $id: "home",
    $label: "Home",
    $priority: 100,
    to: "/"
});

// Nested under a section
runtime.registerNavigationItem({
    $id: "child",
    $label: "Child",
    to: "/child"
}, { sectionId: "parent-section" });
```

### Deferred Registrations

Register navigation items conditionally based on user data or feature flags:

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    runtime.registerRoute({
        path: "/admin",
        element: <AdminPage />
    });

    // Return function for deferred registration
    return (deferredRuntime, { userData }) => {
        if (userData.isAdmin && deferredRuntime.getFeatureFlag("enable-admin")) {
            deferredRuntime.registerNavigationItem({
                $id: "admin",
                $label: "Admin",
                to: "/admin"
            });
        }
    };
};
```

Execute deferred registrations in the host:

```tsx
function BootstrappingRoute() {
    const [userData] = usePublicDataQueries([userQuery]);

    const data = useMemo(() => ({ userData }), [userData]);
    useDeferredRegistrations(data);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }
    return <Outlet />;
}
```

## Reference Documentation

For detailed API references, see:

- [runtime.md](references/runtime.md) - FireflyRuntime API
- [routing.md](references/routing.md) - AppRouter, useNavigationItems, useRenderedNavigationItems
- [data-fetching.md](references/data-fetching.md) - usePublicDataQueries, useProtectedDataQueries
- [integrations.md](references/integrations.md) - MSW, TanStack Query, i18next, LaunchDarkly, Honeycomb, Storybook
- [utilities.md](references/utilities.md) - useLogger, useEventBus, useEnvironmentVariable, useFeatureFlag
