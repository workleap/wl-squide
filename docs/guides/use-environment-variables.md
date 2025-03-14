---
order: 830
---

# Use environment variables

!!!warning
Before going forward with this guide, make sure that you completed the [Setup Mock Service Worker](./setup-msw.md) guide.
!!!

Environment variables are incredibly useful when working with **multiple environments**, such as `dev`, `staging`, and `production`, by **decoupling configuration from** the **code**. This allows to change an application's behavior without modifying the code itself. A common example is the URLs of dedicated API services, where each environment uses a different URL.

In webpack, environment variables are typically passed from the CLI to the application code using the [DefinePlugin](https://webpack.js.org/plugins/define-plugin/) and accessed through `process.env`, e.g. `process.env.BASE_API_URL`.

While accessing environment variables from `process.env` works, it has a few downsides:

- **It's not ideal for testing**. Tests relying on global variables can inadvertently affect other tests, introducing potential issues that affect test reliability, maintainability, and isolation.
- **It complicates** [module development in isolation](./develop-a-module-in-isolation.md). A modular application [shell](./develop-a-module-in-isolation.md#create-a-shell-package) often makes requests to multiple endpoints, which vary depending on the environment. These endpoints require environment variables to define their URLs. When developing modules in isolation, modules should not provide these environment variables to the shell. Instead, to **improve DX**, the shell library should **manage** these environment variables **internally**.

To replace `process.env`, Squide provides the [EnvironmentVariablesPlugin](../reference/env-vars/getEnvironmentVariablesPlugin.md). This plugin acts as a registry and integrates with the [Runtime API](../reference/runtime/runtime-class.md), allowing modules to register and retrieve environment variables.

Before this plugin, page components would directly rely on `process.env`:

```tsx !#6
import { fetchJson } from "@sample/shared";
import { useSuspenseQuery } from "@tanstack/react-query";

export function Page() {
    const { data } = useSuspenseQuery({ queryKey: [`${process.env.baseApiUrl}/getData`], queryFn: () => {
        return fetchJson(`${process.env.baseApiUrl}/getData`);
    } });

    return (
        <div>{JSON.stringify(data)}</div>
    );
}
```

With the `EnvironmentVariablesPlugin`, a page component can now retrieve the `baseApiUrl` from Squide's runtime instance by using the [useEnvironmentVariable](../reference/env-vars/useEnvironmentVariable.md) hook:

```tsx !#6,9
import { useEnvironmentVariable } from "@squide/env-vars";
import { fetchJson } from "@sample/shared";
import { useSuspenseQuery } from "@tanstack/react-query";

export function Page() {
    const baseApiUrl = useEnvironmentVariable("baseApiUrl");

    const { data } = useSuspenseQuery({ queryKey: [`${baseApiUrl}/getData`], queryFn: () => {
        return fetchJson(`${baseApiUrl}/getData`);
    } });

    return (
        <div>{JSON.stringify(data)}</div>
    );
}
```

Let's go through the setup of the plugin and how to handle a few use cases.

## Install the package

First, open an existing Squide application. Then open a terminal at the root of the host application and install the following package:

+++ pnpm
```bash
pnpm add @squide/env-vars
```
+++ yarn
```bash
yarn add @squide/env-vars
```
+++ npm
```bash
npm install @squide/env-vars
```
+++

!!!warning
While you can use any package manager to develop an application with Squide, it is highly recommended that you use [PNPM](https://pnpm.io/) as the guides has been developed and tested with PNPM.
!!!

## Setup the plugin

Then, update the host application boostrapping code to register an instance of the [EnvironmentVariablesPlugin](../reference/env-vars/EnvironmentVariablesPlugin.md) with the [FireflyRuntime](../reference/runtime/runtime-class.md) instance:

```tsx !#13 host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { ConsoleLogger, RuntimeContext, FireflyRuntime, boostrap, type RemoteDefinition } from "@squide/firefly";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";
import { registerShell } from "@sample/shell";

const Remotes: RemoteDefinition[] = [
    { url: name: "remote1" }
];

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x)],
    loggers: [x => new ConsoleLogger(x)]
});

await bootstrap(runtime, {
    localModules: [registerShell, registerHost],
    remotes: Remotes
})

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

### Module augmentation

Before registering variables, modules must [augment](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) the `EnvironmentVariables` TypeScript interface with the variables they intend to register to ensure type safety and autocompletion.

To do this, first create a `types` folder:

``` !#7-8
host
├── src
├────── register.tsx
├────── Page.tsx
├────── index.tsx
├────── App.tsx
├── types
├────── env-vars.d.ts
```

Then create an `env-vars.d.ts` file:

```ts !#6 host/types/env-vars.d.ts
import "@squide/env-vars";

declare module "@squide/env-vars" {
    interface EnvironmentVariables {
        // In the example above, the module only intends to register the `baseApiUrl` environment variable.
        baseApiUrl: string;
    }
}
```

Finally, update the module `tsconfig.json` to include the `types` folder:

```json !#3 host/tsconfig.json
{
    "extends": "@workleap/typescript-configs/web-application.json",
    "include": ["src", "types"],
    "exclude": ["dist", "node_modules"]
}
```

If the project contains Typescript files at its root that need to be linted (such as tooling configuration files), consider including all project files instead of specific directories:

```json !#3 host/tsconfig.json
{
    "extends": "@workleap/typescript-configs/web-application.json",
    "include": ["."],
    "exclude": ["dist", "node_modules"]
}
```

### Register variables

Now, let's register our first variable. We recommend registering environment variables in the module's [register function](../reference/registration/registerLocalModules.md#register-a-local-module) as it's the most logical place to access the runtime instance:

```tsx !#7-11 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

function registerEnvironmentVariables(runtime: FireflyRuntime) {
    const plugin = getEnvironmentVariablesPlugin(runtime);

    plugin.registerVariable("baseApiUrl", "https://my-domain.com/api");
}

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    registerEnvironmentVariables(runtime);

    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });
};
```

!!!info
If multiple modules need to use the same environment variable, we recommend that each module register its own instance of the variable to maintain modularity. The `EnvironmentVariablesPlugin` registry will ignore any subsequent registrations for existing keys, as long as the variable value remains the same.
!!!

### Retrieve a variable in React code

Then, retrieve the variables in a new `DataPage` component using either the [useEnvironmentVariable](../reference/env-vars/useEnvironmentVariable.md) or [useEnvironmentVariables](../reference/env-vars/useEnvironmentVariables.md) hook:

```tsx !#6,9 host/src/DataPage.tsx
import { useEnvironmentVariable } from "@squide/env-vars";
import { fetchJson } from "@sample/shared";
import { useSuspenseQuery } from "@tanstack/react-query";

export function DataPage() {
    const baseApiUrl = useEnvironmentVariable("baseApiUrl");

    const { data } = useSuspenseQuery({ queryKey: [`${baseApiUrl}/getData`], queryFn: () => {
        return fetchJson(`${baseApiUrl}/getData`);
    } });

    return (
        <div>{JSON.stringify(data)}</div>
    );
}
```

Finally, register a route for the component:

```tsx !#38-41 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";
import { DataPage } from "./DataPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

function registerEnvironmentVariables(runtime: FireflyRuntime) {
    const plugin = getEnvironmentVariablesPlugin(runtime);

    plugin.registerVariable("baseApiUrl", "https://my-domain.com/api");
}

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    registerEnvironmentVariables(runtime);

    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });

    runtime.registerRoute({
        path: "data",
        element: <DataPage />
    });
};
```

### Retrieve a variable for MSW handlers

Next, create an MSW handlers for the `DataPage` component. An handler can retrieve the variables using either the plugin's [getVariable](../reference/env-vars/EnvironmentVariablesPlugin.md#retrieve-a-single-environment-variable) or [getVariables](../reference/env-vars/EnvironmentVariablesPlugin.md#retrieve-all-the-environment-variables) function:

```tsx !#8,11 host/src/mocks/api.ts
import type { FireflyRuntime } from "@squide/firefly";
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { http, HttpResponse, type HttpHandler } from "msw";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getApiHandlers(runtime: FireflyRuntime): HttpHandler[] {
    const apiBaseUrl = getEnvironmentVariablesPlugin(runtime).getVariable("apiBaseUrl");

    return [
        http.get(`${apiBaseUrl}/getData`, () => {
            return HttpResponse.json({
                "foo": "bar"
            });
        });
    ];
}
```

Finally, register the new handler:

```tsx !#14-22,27 host/src/register.tsx
import { PublicRoutes, ProtectedRoutes, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";
import { DataPage } from "./DataPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

function registerEnvironmentVariables(runtime: FireflyRuntime) {
    const plugin = getEnvironmentVariablesPlugin(runtime);

    plugin.registerVariable("baseApiUrl", "https://my-domain.com/api");
}

async function registerRequestHandlers(runtime: FireflyRuntime) {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the application bundles.
        const requestHandlers = (await import("../mocks/api.ts")).getApiHandlers(runtime);

        runtime.registerRequestHandlers(requestHandlers);
    }
}

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    registerEnvironmentVariables(runtime);

    await registerRequestHandlers(runtime);

    runtime.registerRoute({
        element: <RootLayout />,
        children: [
            // Placeholders indicating where non hoisted or nested public and protected routes will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });

    runtime.registerRoute({
        path: "data",
        element: <DataPage />
    });
};
```

## Try it :rocket:

Start the application in a development environment using the `dev` script and navigate to the `/data` page. The page should render `{ "foo": "bar" }`.

### Troubleshoot issues

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs (including MSW request handlers) and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.

## Integrate with tests

If the code under test uses environment variables, the `EnvironmentVariablesPlugin` can be used to mock these variables.

Considering the following utility hook:

```ts !#2 host/src/useAbsoluteUrl.ts
export function useAbsoluteUrl(path: string) {
    const apiBaseUrl = useEnvironmentVariable("apiBaseUrl");

    return `${apiBaseUrl}/${path}`;
}
```

You can write the following unit test to mock the value of `apiBaseUrl` and test the ouput of the `useAbsoluteUrl` hook:

```tsx !#9,13 host/tests/useAbsoluteUrl.tsx
import { RuntimeContext, FireflyRuntime } from "@squide/firefly";
import { EnvironmentVariablesPlugin, getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAbsoluteUrl } from "../src/useAbsoluteUrl.ts";

test("an absolute URL including the API base URL is returned", () => {
    const runtime = new FireflyRuntime({
        plugins: [x => new EnvironmentVariablesPlugin(x)]
    });

    const plugin = getEnvironmentVariablesPlugin(runtime);
    plugin.registerVariable("apiBaseUrl", "https://foo.com");

    const { result } = renderHook(() => useAbsoluteUrl("bar"), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                {children}
            </RuntimeContext.Provider>
        )
    })

    expect(result).toBe("https://foo.com/bar");
});
```

## Integrate with stories

Components included in [Storybook](https://storybook.js.org/docs) stories often rely on environment variables. The `EnvironmentVariablesPlugin` can be used to mock these variables:

```tsx !#6 .storybook/preview.tsx
import { FireflyRuntime, RuntimeProvider } from "@squide/firefly";
import { EnvironmentVariablesPlugin, getEnvironmentVariablesPlugin } from "@squide/env-vars";
import type { Preview } from "@storybook/react";

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x)]
});

const plugin = getEnvironmentVariablesPlugin(runtime);
plugin.registerVariable("apiBaseUrl", "https://foo.com");

const preview: Preview = {
    decorators: [Story => {
        return (
            <RuntimeProvider runtime={runtime}>
                <Story />
            </RuntimeProvider>
        );
    }]
};

export default preview;
```

## Integrate with libraries

Libraries, such as an application [Shell](./develop-a-module-in-isolation.md#create-a-shell-package), often need to manage environment variables internally to be portable.


Assuming the host application registers the `EnvironmentVariablesPlugin` into the runtime, and given the following file structure:

```
shell
├── src
├────── register.tsx
├── types
├────── env-vars.d.ts
```

To setup such a library, first, create a `registerShell` function that accepts an argument indicating the current environment (e.g., `dev`, `staging` or `production`):

```ts !#5-9 shell/src/register.tsx
import type { ModuleRegisterFunction } from "@squide/firefly";

export type Environment = "dev" | "staging" | "production";

export function registerShell(env: Environment) {
    const register: ModuleRegisterFunction = runtime => {
        ...
    }
}
```

### Register variables

Then, update the `registerShell` function to register the `apiBaseUrl` environment variable based on the provided `env` argument:

```ts !#41-44 shell/src/register.tsx
import type { ModuleRegisterFunction } from "@squide/firefly";
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";

export type Environment = "dev" | "staging" | "production";

export interface ShellEnvironmentVariables {
    apiBaseUrl: string;
}

const DevEnvironmentVariables: ShellEnvironmentVariables = {
    apiBaseUrl: "https://dev.com"
};

const StagingEnvironmentVariables: ShellEnvironmentVariables = {
    apiBaseUrl: "https://staging.com"
};

const ProductionEnvironmentVariables: ShellEnvironmentVariables = {
    apiBaseUrl: "https://production.com"
};

function getEnvironmentVariables(env: Environment): ShellEnvironmentVariables {
    switch (env) {
        case "dev": {
            return DevEnvironmentVariables;
        }
        case "staging": {
            return StagingEnvironmentVariables;
        }
        case "production": {
            return ProductionEnvironmentVariables;
        }
        default: {
            throw new Error(`[shell] Unknown environment "${env}".`);
        }
    }
}

export function registerShell(env: Environment) {
    const register: ModuleRegisterFunction = runtime => {
        const variables = getEnvironmentVariables(env);

        const plugin = getEnvironmentVariablesPlugin(runtime);
        runtime.registerVariables(variables);
    }
}
```

### Module augmentation

Then, augment the `EnvironmentVariables` TypeScript interface to include the `apiBaseUrl` variable:

```ts !#6 shell/types/env-vars.d.ts
import "@squide/env-vars";

declare module "@squide/env-vars" {
    interface EnvironmentVariables {
        // In the example above, the module only intends to register the `baseApiUrl` environment variable.
        baseApiUrl: string;
    }
}
```

Then, update the module `tsconfig.json` to include the `types` folder:

```json !#3 shell/tsconfig.json
{
    "extends": "@workleap/typescript-configs/web-application.json",
    "include": ["src", "types"],
    "exclude": ["dist", "node_modules"]
}
```

Finally, when [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) is linting the codebase, it expects every code library that augments the `EnvironmentVariables` interface to include its typings. To do this, add each code library's `types` folder to every projects' tsconfig.json file that depends on code libraries:

```json !#6 host/tsconfig.json
{
    "extends": "@workleap/typescript-configs/web-application.json",
    "include": [
        "src",
        "types"
        "../shell/types"
    ],
    "exclude": ["dist", "node_modules"]
}
```

```json !#6 local-module/tsconfig.json
{
    "extends": "@workleap/typescript-configs/library.json",
    "include": [
        "src",
        "types"
        "../shell/types"
    ],
    "exclude": ["dist", "node_modules"]
}
```

```json !#6 remote-module/tsconfig.json
{
    "extends": "@workleap/typescript-configs/web-application.json",
    "include": [
        "src",
        "types"
        "../shell/types"
    ],
    "exclude": ["dist", "node_modules"]
}
```

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each environment variable registration that occurs and error messages if something went wrong:
    - `[squide] The following environment variables has been registered: {...}`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
