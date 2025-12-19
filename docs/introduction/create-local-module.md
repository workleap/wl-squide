---
order: 80
---

# Create a local module

!!!info Use an existing template
We highly recommend going through the entire getting started guide. However, if you prefer to scaffold the application we'll be building, a template is available with [degit](https://github.com/Rich-Harris/degit):

```bash
pnpx degit https://github.com/workleap/wl-squide/templates/getting-started
```
!!!

Local modules expose a `registration` function to the host application's bootstrapping code. A local module can be a standalone package, a sibling package in a monorepo, or even a local folder within the host application.

Let's add a local module to demonstrate how it's done!

## Install the packages

Create a new application (we'll refer to ours as `local-module`), then open a terminal at the root of the local module and install the following packages:

```bash
pnpm add -D typescript @types/react @types/react-dom
```

## Setup the application

First, create the following files:

```
local-modules
├── src
├──── register.tsx
├──── Page.tsx
├── package.json
```

Then, ensure that you are developing your module using [ESM syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) by specifying `type: module` in your `package.json` file:

```json !#2 local-module/package.json
{
    "type": "module"
}
```

Then, configure the package to be shareable by adding the `name`, `version`, and `export` fields to the `package.json` file:

```json !#2-4 local-module/package.json
{
    "name": "@getting-started/local-module",
    "version": "0.0.1",
    "exports": "./src/register.tsx"
}
```

> For more information about the `exports` field, refer to this resource on [Just-In-Time Packages](https://www.shew.dev/monorepos/packaging/jit).

Finally, add the following `peerDependencies`:

```json !#5-14 local-module/package.json
{
    "name": "@getting-started/local-module",
    "version": "0.0.1",
    "exports": "./src/register.tsx",
    "peerDependencies": {
        "@opentelemetry/api": "^1.2.3",
        "@squide/firefly": "^1.2.3",
        "@tanstack/react-query": "^1.2.3",
        "launchdarkly-js-client-sdk": "^1.2.3",
        "msw": "^1.2.3",
        "react": "^1.2.3",
        "react-dom": "^1.2.3",
        "react-router": "^1.2.3"
    }
}
```

### Routes registration

Next, register the local module routes and navigation items with [registerRoute](/reference/runtime/FireflyRuntime.md#register-routes) and [registerNavigationItem](/reference/runtime/FireflyRuntime.md#register-navigation-items) functions:

```tsx !#5-8,10-14 local-module/src/register.tsx
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
}
```

Then, create the `Page` component:

```tsx local-module/src/Page.tsx
export function Page() {
    return (
        <div>Hello from Local/Page!</div>
    );
}
```

## Register the local module

Go back to the `host` application and add a dependency to the `@getting-started/local-module` package in the host application `package.json` file:

```json !#3 host/package.json
{
    "dependencies": {
        "@getting-started/local-module": "0.0.1"
    }
}
```

!!!tip
If your project is set up as a monorepo, use `workspace:*` for the version instead of `0.0.1`.
!!!

Then, register the local module with the [initializeFirefly](/reference/registration/initializeFirefly.md) function:

```tsx !#3,9 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register as registerMyLocalModule } from "@getting-started/local-module";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Register the modules.
const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Try it :rocket:

Start the `host` application in development mode using the `dev` script. You should notice an additional link labelled `Local/Page` in the navigation menu. Click on the link to navigate to the page of your new **local** module!

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] The following route has been registered.`
    - `[squide] The following static navigation item has been registered to the "root" menu for a total of 2 static items.`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/basic/local-module).
- Refer to the [troubleshooting](../troubleshooting.md) page.
