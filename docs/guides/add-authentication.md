---
order: 920
---

# Add authentication

!!!warning
Before going forward with this guide, make sure that you completed the [Setup Mock Service Worker](./setup-msw.md) and [Fetch global data](./fetch-global-data.md) guides.
!!!

Most of Workleap's applications, if not all, will eventually require user authentication. While Squide doesn't offer built-in primitives for this process, it can assist by providing a **well-established recipe** to integrate an authentication flow with Squide.

## Add a login page

First, open a terminal at the root of the host application and install the [@squide/fakes](https://www.npmjs.com/package/@squide/fakes) package:

+++ pnpm
```bash
pnpm add @squide/fakes
```
+++ yarn
```bash
yarn add @squide/fakes
```
+++ npm
```bash
npm install @squide/fakes
```
+++

!!!warning
While you can use any package manager to develop an application with Squide, it is highly recommended that you use [PNPM](https://pnpm.io/) as the guides has been developed and tested with PNPM.
!!!

Then, add a [Mock Service Worker](https://mswjs.io/) (MSW) request handler to authenticate a user:

```ts !#29-31,41-44 host/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";
import { LocalStorageSessionManager } from "@squide/fakes";

interface LoginCredentials {
    username: string;
    password: string;
}

const Users = [
    {
        username: "temp",
        password: "temp"
    }
];

export interface Session {
    username: string;
    preferredLanguage: string;
}

// For simplicity, we are using a local storage session manager for this guide.
export const sessionManager = new LocalStorageSessionManager<Session>();

export const requestHandlers: HttpHandler[] = [
    http.post("/api/login", async ({ request }) => {
        const { username, password } = await request.json() as LoginCredentials;

        // Try to match the credentials against existing users.
        const user = Users.find(x => {
            return x.username === username && x.password === password;
        });

        // If the user doesn't exist, return a 401.
        if (!user) {
            return new HttpResponse(null, {
                status: 401
            });
        }

        // Login the user by storing the session to the local storage.
        sessionManager.setSession({
            username: user.username,
            preferredLanguage: user.preferredLanguage
        });

        return new HttpResponse(null, {
            status: 200
        });
    })
];
```

In the previous code sample, the endpoint attempts to authenticate the provided credentials against existing users. If there's a match, the user session is stored in the local storage using a [LocalStorageSessionManager](../reference/fakes/localStorageSessionManager.md) instance, and a `200` status code is returned.

!!!warning
Our security department reminds you to refrain from using a fake `LocalStorageSessionManager` in a production application :blush:
!!!

Next, register the request handler using the host application registration function:

```tsx host/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the application bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
};
```

Then, create a login page:

```tsx !#13-22,26 host/src/Login.tsx
import { useCallback, useState, type ChangeEvent, type MouseEvent } from "react";
import { Navigate, useNavigate } from "react-router/dom";

export function Login() {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const response = await fetch("/api/login", {
            body: JSON.stringify({ 
                username, 
                password
            }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            // Reload the application after a login.
            window.location.href = "/";
        }
    }, [username, password, navigate]);

    const handleUserNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    }, []);

    const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    }, []);

    return (
        <main>
            <h1>Login</h1>
            <form>
                <div>
                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" onChange={handleUserNameChange} />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" onChange={handlePasswordChange} />
                </div>
                <div>
                    <button type="submit" onClick={handleClick}>
                        Login
                    </button>
                </div>
            </form>
        </main>
    );
}
```

After the user logs in, the application is reloaded, this is a requirement of the [AppRouter](../reference/routing/appRouter.md) component. Nevertheless, it's not a concern because Workleap's applications use a third-party service for authentication which requires a full refresh of the application.

## Create a session manager

Next, create a shared type for the session and the session manager:

```ts shared/src/session.ts
export interface Session {
    user: {
        name: string;
    };
}

export interface SessionManager {
    getSession: () => Session | undefined;
    clearSession: () => void;
}
```

Then, create a shared `SessionManagerContext` along with some utility hooks. This React context will be used to share the `SessionManager` instance down the components tree:

```ts shared/src/session.ts
export const SessionManagerContext = createContext<SessionManager | undefined>(undefined);

export function useSessionManager() {
    return useContext(SessionManagerContext);
}

export function useSession() {
    const sessionManager = useSessionManager();

    return sessionManager?.getSession();
}

export function useIsAuthenticated() {
    const sessionManager = useSessionManager();

    return !!sessionManager?.getSession();
}
```

Finally, let's go back to the host application and create a [TanStack Query](https://tanstack.com/query/latest) implementation of the shared `SessionManager` interface created previously:

```ts host/src/sessionManager.ts
import type { SessionManager, Session } from "@sample/shared";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

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

export function useSessionManagerInstance(session: Session) {
    const queryClient = useQueryClient();

    return useMemo(() => new TanstackQuerySessionManager(session, queryClient), [session, queryClient]);
}
```

## Fetch the session

Next, create an MSW request handler that returns a session object if a user is authenticated:

```ts !#50-61 host/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";
import { LocalStorageSessionManager } from "@squide/fakes";

interface LoginCredentials {
    username: string;
    password: string;
}

const Users = [
    {
        username: "temp",
        password: "temp"
    }
];

export interface Session {
    username: string;
    preferredLanguage: string;
}

// For simplicity, we are using a local storage session manager for this guide.
export const sessionManager = new LocalStorageSessionManager<Session>();

export const requestHandlers: HttpHandler[] = [
    http.post("/api/login", async ({ request }) => {
        const { username, password } = await request.json() as LoginCredentials;

        // Try to match the credentials against existing users.
        const user = Users.find(x => {
            return x.username === username && x.password === password;
        });

        // If the user doesn't exist, return a 401.
        if (!user) {
            return new HttpResponse(null, {
                status: 401
            });
        }

        // Login the user by storing the session to the local storage.
        sessionManager.setSession({
            username: user.username
        });

        return new HttpResponse(null, {
            status: 200
        });
    }),

    http.post("/api/session", ({ request }) => {
        // Retrieve the session stored by the /api/login endpoint.
        const session = sessionManager.getSession();

        if (!session) {
            return new HttpResponse(null, {
                status: 401
            });
        }

        return HttpResponse.json(session);
    })
];
```

Then, update the host application `App` component to load the session with the [useProtectedDataQueries](../reference/tanstack-query/useProtectedDataQueries.md) hook and create an instance of `TanstackQuerySessionManager` with the retrieved session to share the sessuib via the `SessionManagerContext`:

```tsx !#8-29,31,38,48,58 host/src/App.tsx
import { AppRouter, useProtectedDataQueries, useIsBootstrapping } from "@squide/firefly";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SessionManagerContext, ApiError, isApiError, type Session } from "@sample/shared";
import { useSessionManagerInstance } from "./sessionManager.ts";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const result: Session = {
                    user: {
                        name: data.username,
                    }
                };

                return result;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    const sessionManager = useSessionManagerInstance(session!);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <SessionManagerContext.Provider value={sessionManager}>
            <Outlet />
        </SessionManagerContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter 
            waitForMsw
            waitForProtectedData
        >
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
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
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

The previous example uses the following implementation of the `ApiError` class:

```ts shared/src/apiError.ts
export class ApiError extends Error {
    readonly #status: number;
    readonly #statusText: string;
    readonly #stack?: string;

    constructor(status: number, statusText: string, innerStack?: string) {
        super(`${status} ${statusText}`);

        this.#status = status;
        this.#statusText = statusText;
        this.#stack = innerStack;
    }

    get status() {
        return this.#status;
    }

    get statusText() {
        return this.#statusText;
    }

    get stack() {
        return this.#stack;
    }
}

export function isApiError(error?: unknown): error is ApiError {
    return error !== undefined && error !== null && error instanceof ApiError;
}
```

## Add an authentication boundary

Next, create an authentication boundary component using the shared `useIsAuthenticated` hook created earlier to redirect unauthenticated user to the login page:

```tsx host/src/AuthenticationBoundary.tsx
import { Navigate, Outlet } from "react-router/dom";
import { useIsAuthenticated } from "@sample/shared";

export function AuthenticationBoundary() {
    const isAuthenticated = useIsAuthenticated();

    if (isAuthenticated) {
        return <Outlet />;
    }

    return <Navigate to="/login" />;
}
```

## Define an authenticated layout

Now, let's add a specific layout for authenticated users that passes through the `AuthenticationBoundary` component.

First, add a MSW request handler to log out a user:

```ts !#50-57 host/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";
import { LocalStorageSessionManager } from "@squide/fakes";

interface LoginCredentials {
    username: string;
    password: string;
}

const Users = [
    {
        username: "temp",
        password: "temp"
    }
];

export interface Session {
    username: string;
    preferredLanguage: string;
}

// For simplicity, we are using a local storage session manager for this guide.
export const sessionManager = new LocalStorageSessionManager<Session>();

export const requestHandlers: HttpHandler[] = [
    http.post("/api/login", async ({ request }) => {
        const { username, password } = await request.json() as LoginCredentials;

        // Try to match the credentials against existing users.
        const user = Users.find(x => {
            return x.username === username && x.password === password;
        });

        // If the user doesn't exist, return a 401.
        if (!user) {
            return new HttpResponse(null, {
                status: 401
            });
        }

        // Login the user by storing the session to the local storage.
        sessionManager.setSession({
            username: user.username
        });

        return new HttpResponse(null, {
            status: 200
        });
    }),

    http.post("/api/logout", () => {
        // Remove the session from the local storage.
        sessionManager.clearSession();

        return new HttpResponse(null, {
            status: 200
        });
    }),

    http.post("/api/session", ({ request }) => {
        // Retrieve the session stored by the /api/login endpoint.
        const session = sessionManager.getSession();

        if (!session) {
            return new HttpResponse(null, {
                status: 401
            });
        }

        return HttpResponse.json(session);
    })
];
```

Then, introduce a new `AuthenticatedLayout` component displaying the name of the logged-in user along with a logout button. This layout will retrieve the active user session from the shared `useSessionManager` hook introduced earlier:

```tsx !#40-41,43-60,72,75 host/src/AuthenticatedLayout.tsx
import { Suspense, useCallback, type ReactNode, type MouseEvent, type HTMLButtonElement } from "react";
import { Link, Outlet, navigate } from "react-router/dom";
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/react-router";
import { useSessionManager } from "@sample/shared";

const renderItem: RenderItemFunction = (item, key) => {
    // To keep things simple, this sample doesn't support nested navigation items.
    // For an example including support for nested navigation items, have a look at
    // https://gsoft-inc.github.io/wl-squide/reference/routing/userenderednavigationitems/
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

export function AuthenticatedLayout() {
    const sessionManager = useSessionManager();
    const session = sessionManager?.getSession();

    const handleLogout = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const response = await fetch("/api/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            // Clear the in-memory session to ensure the authentication boundary can do his job.
            sessionManager?.clearSession();

            // Redirect the user to the login page.
            navigate("/login");
        }
    }, [navigate, sessionManager]);

    const navigationItems = useNavigationItems();
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <div style={{ display: "flex", alignItems: "center" }}>
                <nav style={{ width: "100%" }}>
                    {renderedNavigationItems}
                </nav>
                <div style={{ whiteSpace: "nowrap", marginRight: "20px" }}>
                    (User: <span style={{ fontWeight: "bold" }}>{session?.user.name}</span>)
                </div>
                <div>
                    <button type="button" onClick={handleLogout}>Log out</button>
                </div>
            </div>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}
```

By creating a new `AuthenticatedLayout` component, much of the layout code has been transferred from the `RootLayout` to the `AuthenticatedLayout`, leaving the root layout responsible only for styling the outer wrapper of the application for now:

```tsx host/src/RootLayout.tsx
import { Suspense } from "react";
import { Outlet } from "react-router/dom";

export function RootLayout() {
    return (
        <div style={{ margin: "20px" }}>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </div>
    );
}
```

## Setup the routes

Finally, assemble everything:

```tsx !#13,16,20,22,30-33 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { RootLayout } from "./Rootlayout.tsx";
import { AuthenticationBoundary } from "./AuthenticationBoundary.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { HomePage } from "./Homepage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            // All the public routes will render before the authenticated layout.
            PublicRoutes,
            {
                // Every page beyond the authenticated boundary are protected.
                element: <AuthenticationBoundary />,
                children: [
                    {
                        // All the protected routes will render the authenticated layout.
                        element: <AuthenticatedLayout />,
                        children: [
                            ProtectedRoutes
                        ]
                    }
                ]
            }
        ]
    });

    runtime.registerPublicRoute({
        path: "/login",
        element: <LoginPage />
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });

    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the application bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
});
```

## Try it :rocket:

Start the application using the `dev` script and attempt navigating to the root page (`/`). You will be redirected to the `/login` page. Login with `"temp"` / `"temp"`, you will be redirected to the root page.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/basic/shell).
- Refer to the [troubleshooting](../troubleshooting.md) page.













