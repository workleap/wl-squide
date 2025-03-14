---
order: 80
---

# Create a local module

!!!info Use an existing template

We highly recommend going through the entire getting started guide. However, if you prefer to scaffold the application we'll be building, a template is available with [degit](https://github.com/Rich-Harris/degit):

```bash
corepack pnpm dlx degit https://github.com/gsoft-inc/wl-squide/templates/getting-started
```
!!!

Local modules are regular modules that are part of the **host application build**. They are independent modules that expose a `registration` function to the host application's bootstrapping code. A local module can be a standalone package, a sibling project (in a monorepo setup), or even a local folder within the host application.

Local modules have many uses but are especially useful when **launching** a **new product** with an unrefined business domain or **migrating** from a **monolithic application** to a distributed application.

Let's add a local module to demonstrate how it's done!

## Install the packages

Create a new application (we'll refer to ours as `local-module`), then open a terminal at the root of the new solution and install the following packages:

+++ pnpm
```bash
pnpm add -D typescript @types/react @types/react-dom react react-dom react-router @tanstack/react-query
pnpm add @squide/firefly
```
+++ yarn
```bash
yarn add -D typescript @types/react @types/react-dom react react-dom react-router @tanstack/react-query
yarn add @squide/firefly
```
+++ npm
```bash
npm add -D typescript @types/react @types/react-dom react react-dom react-router @tanstack/react-query
npm install @squide/firefly
```
+++

!!!warning
While you can use any package manager to develop an application with Squide, it is highly recommend that you use [PNPM](https://pnpm.io/) as the guides has been developed and tested with PNPM.
!!!

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

```json local-module/package.json
{
    "type": "module"
}
```

Then, configure the package to be shareable by adding the `name`, `version`, and `export` fields to the `package.json` file:

```json local-module/package.json
{
    "name": "@getting-started/local-module",
    "version": "0.0.1",
    "exports": "./src/register.tsx"
}
```

> For more information about the `exports` field, refer to this resource on [Just-In-Time Packages](https://www.shew.dev/monorepos/packaging/jit).

Finally, add the following `peerDependencies`:

```json !#5-10 local-module/package.json
{
    "name": "@getting-started/local-module",
    "version": "0.0.1",
    "exports": "./src/register.tsx",
    "peerDependencies": {
        "@tanstack/react-query": "*",
        "react": "*",
        "react-dom": "*",
        "react-router": "*"
    }
}
```

### Routes registration

Next, register the local module routes and navigation items with [registerRoute](/reference/runtime/runtime-class.md#register-routes) and [registerNavigationItem](/reference/runtime/runtime-class.md#register-navigation-items) functions:

```tsx !#5-8,10-14 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/local/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "local-page",
        $label: "Local/Page",
        to: "/local/page"
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

```json host/package.json
{
    "dependencies": {
        "@getting-started/local-module": "0.0.1"
    }
}
```

!!!info
If your project is set up as a monorepo, use `workspace:*` for the version instead of `0.0.1`.
!!!

Then, register the local module with the [bootstrap](/reference/registration/bootstrap.md) function:

```tsx !#3,19 host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { ConsoleLogger, RuntimeContext, FireflyRuntime, bootstrap, type RemoteDefinition } from "@squide/firefly";
import { register as registerMyLocalModule } from "@getting-started/local-module";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime({
    loggers: [x => new ConsoleLogger(x)]
});

// Register the modules.
await bootstrap(runtime, {
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes
})

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

## Try it :rocket:

Start the `host` and `remote-module` applications in development mode using the `dev` script. You should notice an additional link labelled `Local/Page` in the navigation menu. Click on the link to navigate to the page of your new **local** module!

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] The following route has been registered.`
    - `[squide] The following static navigation item has been registered to the "root" menu for a total of 2 static items.`
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/basic/local-module).
- Refer to the [troubleshooting](../troubleshooting.md) page.
