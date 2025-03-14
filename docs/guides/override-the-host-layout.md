---
order: 880
---

# Override the host layout

The `RootLayout` component defined in the [Create an host application](../getting-started/create-host.md#navigation-items) starting guide serves as the default layout for the homepage and all the managed routes.

For most routes, this behavior is what the author expects. However, as an application introduces [authentication](./add-authentication.md) and adds many session-related features to the default layout, this default layout may no longer be suitable for every route. For example, a login page doesn't require session-related features, as the user isn't authenticated yet. In such cases, the default layout isn't appropriate.

To accomodate pages requiring a different layout, a mechanism is needed to move their route declaration to the root of the React Router [instance](https://reactrouter.com/en/main/routers/create-browser-router) before `RootLayout` is declared.

``` !#2
root
├── Login page   <---------------- Raise the page here
├──── Authentication boundary
├──────── Root layout
├───────────  Homepage
```

## Hoist a module routes

Package managers supporting workspaces such as Yarn and NPM call this mechanism "hoisting", which means "raise (something) by means of ropes and pulleys". This is exactly what we are trying to achieve here.

Squide has a built-in [hoist](../reference/runtime/runtime-class.md#register-an-hoisted-route) functionality capable of raising module routes marked as `hoist` at the root of the routes array, before the `RootLayout` declaration. Thus, an hoisted route will not be wrapped by the `RootLayout` component (or any authentication boundaries) and will have full control over its rendering.

To hoist module routes, add the [hoist](../reference/runtime/runtime-class.md#register-an-hoisted-route) option to the route registration options and optionally use a different layout:

```tsx !#9,14,24 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { LocalLayout } from "./LocalLayout.tsx";
import { LocalErrorBoundary } from "./LocalErrorBoundary.tsx";
import { Page } from "./Page.tsx";

export function register: ModuleRegisterFunction<FireflyRuntime>(runtime) {
    runtime.registerRoute({
        path: "/login",
        element: <LocalLayout />,
        children: [
            {
                // Custom error boundary ensuring errors from the route doesn't prevent the other
                // modules of the application from rendering.
                errorElement: <LocalErrorBoundary />,
                children: [
                    {
                        index: true,
                        element: <Page />
                    }
                ]
            }
        ]
    }, {
        hoist: true
    });
}
```

!!!warning
By declaring a route as hoisted, other parts of the application will not be isolated anymore from this route's failures as the route will most likely be rendered outside of the host application's root error boundary. To **avoid breaking the entire application** when an hoisted route encounters unhandled errors, it is highly recommended to declare a React Router's [errorElement](https://reactrouter.com/en/main/route/error-element) property for each hoisted routes.
!!!

!!!warning
By declaring a route as hoisted, the route will be rendered at the root of the router, therefore, most certainly outside the authenticated boundary of the application. If the hoisted route requires an authentication, make sure to **wrap the route with an authentication boundary** or to handle the authentication within the route's page.
!!!

## Try it :rocket:

Start the application in a development environment using the `dev` script and navigate to the `/login` page. The page should be displayed even if you are not authenticated.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/blob/main/samples/basic/remote-module/src/register.tsx).
- Refer to the [troubleshooting](../troubleshooting.md) page.
