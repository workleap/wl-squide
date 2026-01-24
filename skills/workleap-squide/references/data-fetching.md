# Data Fetching API Reference

## Table of Contents

- [Global Data Fetching](#global-data-fetching)
- [usePublicDataQueries](#usepublicdataqueries)
- [useProtectedDataQueries](#useprotecteddataqueries)
- [useDeferredRegistrations](#usedeferredregistrations)
- [isGlobalDataQueriesError](#isglobaldataquerieserror)
- [Page Data Fetching](#page-data-fetching)

## Global Data Fetching

Squide provides TanStack Query wrappers to orchestrate global data loading and UI states.

### Key Concepts

1. **Public Data**: Data accessible to all users (feature flags, public config)
2. **Protected Data**: Data requiring authentication (user session, subscription)
3. **Bootstrapping**: Period when global data is loading, before page renders

### Challenges Addressed

- MSW request handlers must be registered before fetching
- Public routes should only fetch public data
- Protected routes should fetch both public and protected data
- Page rendering should be delayed until global data is ready
- Single loading spinner prevents flickering

## usePublicDataQueries

Fetch global public data with TanStack Query.

```ts
const results = usePublicDataQueries<T extends unknown[]>(
    queries: UseQueryOptions[],
    options?: { suspense?: boolean }
);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `queries` | `UseQueryOptions[]` | Array of TanStack Query options |

### Returns

Array of query results in the same order as input queries.

### Setup Steps

1. Set `waitForPublicData` on `AppRouter`
2. Use `usePublicDataQueries` to fetch data
3. Use `useIsBootstrapping` to show loading state
4. Pass data to pages via React context

### Example

```tsx
import { AppRouter, usePublicDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { FeatureFlagsContext } from "@sample/shared";

function BootstrappingRoute() {
    const [featureFlags] = usePublicDataQueries([
        {
            queryKey: ["/api/feature-flags"],
            queryFn: async () => {
                const response = await fetch("/api/feature-flags");
                if (!response.ok) throw new Error("Failed to fetch");
                return response.json();
            }
        }
    ]);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <FeatureFlagsContext.Provider value={featureFlags}>
            <Outlet />
        </FeatureFlagsContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter waitForPublicData>
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

### Multiple Queries

```tsx
const [config, featureFlags, publicSettings] = usePublicDataQueries([
    {
        queryKey: ["/api/config"],
        queryFn: fetchConfig
    },
    {
        queryKey: ["/api/feature-flags"],
        queryFn: fetchFeatureFlags
    },
    {
        queryKey: ["/api/public-settings"],
        queryFn: fetchPublicSettings
    }
]);
```

## useProtectedDataQueries

Fetch global protected data with authentication error handling.

```ts
const results = useProtectedDataQueries<T extends unknown[]>(
    queries: UseQueryOptions[],
    isUnauthorizedError: (error: unknown) => boolean
);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `queries` | `UseQueryOptions[]` | Array of TanStack Query options |
| `isUnauthorizedError` | `(error: unknown) => boolean` | Function to detect 401 errors |

### Returns

Array of query results. Returns `undefined` for protected queries on public routes.

### Example

```tsx
import { AppRouter, useProtectedDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SessionContext, ApiError, isApiError } from "@sample/shared";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");
                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }
                return response.json();
            }
        }
    ], error => isApiError(error) && error.status === 401);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
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

### With Both Public and Protected Data

```tsx
function BootstrappingRoute() {
    const [config] = usePublicDataQueries([
        {
            queryKey: ["/api/config"],
            queryFn: fetchConfig
        }
    ]);

    const [session, subscription] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: fetchSession
        },
        {
            queryKey: ["/api/subscription"],
            queryFn: fetchSubscription
        }
    ], error => isApiError(error) && error.status === 401);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <ConfigContext.Provider value={config}>
            <SessionContext.Provider value={session}>
                <SubscriptionContext.Provider value={subscription}>
                    <Outlet />
                </SubscriptionContext.Provider>
            </SessionContext.Provider>
        </ConfigContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter waitForPublicData waitForProtectedData>
            {/* ... */}
        </AppRouter>
    );
}
```

## useDeferredRegistrations

Execute deferred module registrations after global data is available.

```ts
useDeferredRegistrations(data?: TData);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `TData` | Optional data object passed to deferred registration functions |

### Usage

Deferred registrations allow modules to conditionally register navigation items based on:
- User data (e.g., isAdmin)
- Feature flags
- Any other runtime data

### Example

```tsx
import { useDeferredRegistrations, usePublicDataQueries, useIsBootstrapping } from "@squide/firefly";
import { useMemo } from "react";
import { Outlet } from "react-router";
import type { DeferredRegistrationData } from "@sample/shared";

function BootstrappingRoute() {
    const [userInfo] = usePublicDataQueries([
        {
            queryKey: ["/api/user-info"],
            queryFn: async () => {
                const response = await fetch("/api/user-info");
                return response.json();
            }
        }
    ]);

    // IMPORTANT: useMemo prevents re-execution on every render
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

### Module with Deferred Registration

```tsx
// local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { DeferredRegistrationData } from "@sample/shared";

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    // Routes are always registered
    runtime.registerRoute({
        path: "/admin",
        element: <AdminPage />
    });

    // Return deferred registration function
    return (deferredRuntime, { userInfo }) => {
        // Conditionally register navigation item
        if (userInfo.isAdmin) {
            deferredRuntime.registerNavigationItem({
                $id: "admin",
                $label: "Admin",
                to: "/admin"
            });
        }
    };
};
```

### Feature Flags Only (No Data)

```tsx
function BootstrappingRoute() {
    // When only using feature flags, no data argument needed
    useDeferredRegistrations();

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return <Outlet />;
}
```

### Automatic Updates

Deferred registrations are automatically re-executed when:
- Data passed to `useDeferredRegistrations` changes
- Feature flags change (when using LaunchDarkly with streaming)

## isGlobalDataQueriesError

Type guard to check if an error is from global data queries.

```ts
function isGlobalDataQueriesError(error: unknown): error is GlobalDataQueriesError
```

### GlobalDataQueriesError

```ts
interface GlobalDataQueriesError {
    message: string;
    errors: Error[];
}
```

### Usage in Error Boundary

```tsx
import { isGlobalDataQueriesError, useLogger } from "@squide/firefly";
import { useRouteError, isRouteErrorResponse, useLocation } from "react-router";
import { useEffect } from "react";

export function ErrorBoundary() {
    const error = useRouteError() as Error;
    const location = useLocation();
    const logger = useLogger();

    useEffect(() => {
        if (isGlobalDataQueriesError(error)) {
            logger
                .withText(`Data fetch error at ${location.pathname}: ${error.message}`)
                .withError(error.errors)
                .error();
        }
    }, [location.pathname, error, logger]);

    return (
        <div>
            <h2>Error</h2>
            <p>Failed to load application data.</p>
        </div>
    );
}
```

## Page Data Fetching

For page-specific data, use TanStack Query's `useSuspenseQuery` with React Suspense.

### Setup

1. Add Suspense boundary in layout
2. Use `useSuspenseQuery` in pages

### Layout with Suspense

```tsx
import { Suspense } from "react";
import { Outlet } from "react-router";

export function RootLayout() {
    return (
        <>
            <nav>{/* navigation */}</nav>
            <Suspense fallback={<div>Loading page...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}
```

### Page Component

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";

interface Character {
    name: string;
    species: string;
}

export function CharactersPage() {
    const { data: characters } = useSuspenseQuery({
        queryKey: ["/api/characters"],
        queryFn: async () => {
            const response = await fetch("/api/characters");
            return response.json();
        }
    });

    return (
        <ul>
            {characters.map((char: Character) => (
                <li key={char.name}>
                    {char.name} - {char.species}
                </li>
            ))}
        </ul>
    );
}
```

### TanStack Query Setup

```tsx
// host/src/index.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools />
        </QueryClientProvider>
    </FireflyProvider>
);
```

## Context Pattern

Create context for global data:

```tsx
// @sample/shared
import { createContext, useContext } from "react";

export interface Session {
    user: {
        id: string;
        name: string;
        isAdmin: boolean;
    };
}

export const SessionContext = createContext<Session | undefined>(undefined);

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within SessionContext.Provider");
    }
    return context;
}
```

## Error Handling Pattern

```tsx
// @sample/shared
export class ApiError extends Error {
    readonly status: number;
    readonly statusText: string;

    constructor(status: number, statusText: string) {
        super(`${status} ${statusText}`);
        this.status = status;
        this.statusText = statusText;
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}
```
