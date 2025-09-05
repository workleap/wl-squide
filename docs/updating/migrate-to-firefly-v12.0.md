---
order: 920
label: Migrate to firefly v12.0
---

# Migrate to firefly v12.0

!!!warning
If you are migrating from `v8.*`, follow the [Migrate from v8.* to v14.0](./migrate-from-v8-to-v14.0.md) guide.
!!!

This major version introduces a new [initializeFirefly](../reference/registration/initializeFirefly.md) function, replacing the `bootstrap` function. This new `initializeFirefly` function is similar the previous `bootstrap` function with the addition that it takes care of creating and returning a [Runtime](../reference/runtime/runtime-class.md) instance.

This major version introduces a new [initializeFirefly](../reference/registration/initializeFirefly.md) function that replaces the legacy `bootstrap` function. In addition to providing similar functionality, `initializeFirefly` creates and returns a [Runtime](../reference/runtime/runtime-class.md) instance.

## Breaking changes

### Removed

- The `bootstrap` function has been removed, use the [initializeFirefly](../reference/registration/initializeFirefly.md) function instead.
- The `waitForMsw` property has been removed from the [AppRouter](../reference/routing/appRouter.md) component.

### Replaced `bootstrap` by `initializeFirefly`

The `bootstrap` function has been replaced by the [initializeFirefly](../reference/registration/initializeFirefly.md) function. This new function behaves similarly to the former `bootstrap function, accepting all its previous arguments, but additionally creates and returns a [Runtime](../reference/runtime/runtime-class.md) instance.

Before:

```tsx !#10-16 bootstrap.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, FireflyRuntime, bootstrap, type RemoteDefinition } from "@squide/firefly";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime();

// Register the remote module.
bootstrap(runtime, {
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

Now:

```tsx !#10-12 bootstrap.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

const runtime = initializeFirefly(runtime, {
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### Remove the `waitForMsw` property of `AppRouter`

Because the `initializeFirefly` function accepts the [useMsw](../reference/runtime/runtime-class.md#use-mock-service-worker) option, the Squide Firefly state machine automatically detects when the application is using Mock Service Worker, eliminating the need to specify the value again.

Before:

```tsx !#7 AppRouter.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

export function App() {
    return (
        <AppRouter waitForMsw>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
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

Now:

```tsx !#4 bootstrap.tsx
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    useMsw: true
});
```

```tsx !#7 AppRouter.tsx
import { AppRouter } from "@squide/firefly";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

export function App() {
    return (
        <AppRouter>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
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
