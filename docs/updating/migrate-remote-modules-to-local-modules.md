---
order: 730
label: Migrate remote modules to local modules
---

# Migrate remote modules to local modules

Squide no longer recommends [Module Federation](https://module-federation.io/). Local modules are now the only documented way to build a Squide application, and the following packages are in maintenance mode:

- [@squide/firefly-module-federation](https://www.npmjs.com/package/@squide/firefly-module-federation)
- [@squide/firefly-rsbuild-configs](https://www.npmjs.com/package/@squide/firefly-rsbuild-configs)
- [@squide/firefly-webpack-configs](https://www.npmjs.com/package/@squide/firefly-webpack-configs)

These packages are still published, but they will not receive new features.

A remote module and a [local module](../introduction/create-local-module.md) share the same registration API, so the code of a module doesn't change.

To migrate a remote module to a local module, based on your project type, execute the following steps :point_down:

## Remote module

### Remove packages

Open a terminal at the root of the remote module project and remove the following package:

```bash
pnpm remove @squide/firefly-rsbuild-configs
```

If the remote module is bundled with webpack, remove the following packages instead:

```bash
pnpm remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```

### Update files

```
remote-module
├── src
├──── register.tsx
├── rsbuild.dev.ts    -->  X
├── rsbuild.build.ts  -->  X
├── package.json
```

#### `package.json`

Open the `package.json` file and add an `exports` field pointing to the file exporting the registration function:

```json !#4 package.json
{
    "name": "@sample/remote-module",
    "version": "0.0.1",
    "exports": "./src/register.tsx"
}
```

> For more information about the `exports` field, refer to this resource on [Just-In-Time Packages](https://www.shew.dev/monorepos/packaging/jit).

Then, move the dependencies that are provided by the host application to the `peerDependencies` field. They usually are the dependencies that were configured as shared dependencies:

Before:

```json package.json
{
    "dependencies": {
        "@squide/firefly": "^1.2.3",
        "react": "^1.2.3",
        "react-dom": "^1.2.3",
        "react-router": "^1.2.3"
    }
}
```

After:

```json package.json
{
    "peerDependencies": {
        "@squide/firefly": "^1.2.3",
        "react": "^1.2.3",
        "react-dom": "^1.2.3",
        "react-router": "^1.2.3"
    }
}
```

#### `rsbuild.dev.ts` and `rsbuild.build.ts`

Delete the `rsbuild.dev.ts` and `rsbuild.build.ts` files, or the `webpack.dev.js` and `webpack.build.js` files if the remote module is bundled with webpack.

!!!tip
If the module is also developed in isolation, keep the development configuration, remove the `defineDevRemoteModuleConfig` function and replace the `defineDevHostConfig` function with the [defineDevConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-dev/) function of `@workleap/rsbuild-configs`. For additional information, refer to the [develop a module in isolation](../recipes/develop-a-module-in-isolation.md) recipe.
!!!

### Update scripts

Remove the `dev`, `build` and deployment scripts.

## Host application

!!!info
If the host application is bundled with webpack, first [migrate to Rsbuild](https://workleap.github.io/wl-web-configs/rsbuild/migrate-from-webpack/), then remove the `@squide/firefly-webpack-configs` package rather than the `@squide/firefly-rsbuild-configs` package.
!!!

### Update packages

Open a terminal at the root of the host application project and install the following package:

```bash
pnpm add -D @workleap/rsbuild-configs
```

Then, in the same terminal, remove the following packages:

```bash
pnpm remove @squide/firefly-module-federation @squide/firefly-rsbuild-configs
```

Finally, add a dependency to the migrated module:

```json !#3 package.json
{
    "dependencies": {
        "@sample/remote-module": "0.0.1"
    }
}
```

!!!tip
If your project is set up as a monorepo, use `workspace:*` for the version instead of `0.0.1`.
!!!

### Update files

```
host
├── src
├──── index.tsx
├── rsbuild.dev.ts
├── rsbuild.build.ts
├── package.json
```

#### `index.tsx`

Import the `initializeFirefly` function from `@squide/firefly`, then replace the `remotes` option with a registration of the migrated module as a local module:

Before:

```tsx !#2,9 host/src/index.tsx
import { FireflyProvider } from "@squide/firefly";
import { initializeFirefly, type RemoteDefinition } from "@squide/firefly-module-federation";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const Remotes: RemoteDefinition[] = [{ name: "remote1" }];

const runtime = initializeFirefly({
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

After:

```tsx !#1-2,7 host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register as registerModule } from "@sample/remote-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [registerModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

#### `rsbuild.dev.ts`

Replace the `defineDevHostConfig` function with the [defineDevConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-dev/) function, then remove the remote definitions and the `features`, `sharedDependencies`, `runtimePlugins` and `moduleFederationPluginOptions` options. If the remote module configuration defined `environmentVariables`, move them to the host application configuration:

Before:

```ts rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [{ name: "remote1", url: "http://localhost:8081" }];

export default defineDevHostConfig(8080, Remotes, {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true,
            eager: true
        }
    }
});
```

After:

```ts rsbuild.dev.ts
import { defineDevConfig } from "@workleap/rsbuild-configs";

export default defineDevConfig({
    port: 8080
});
```

#### `rsbuild.build.ts`

Replace the `defineBuildHostConfig` function with the [defineBuildConfig](https://workleap.github.io/wl-web-configs/rsbuild/configure-build/) function, then remove the remote definitions and the `features`, `sharedDependencies`, `runtimePlugins` and `moduleFederationPluginOptions` options. If the remote module configuration defined `environmentVariables`, move them to the host application configuration:

Before:

```ts rsbuild.build.ts
import { defineBuildHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [{ name: "remote1", url: "https://sample-remote-module.netlify.app" }];

export default defineBuildHostConfig(Remotes, {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true,
            eager: true
        }
    }
});
```

After:

```ts rsbuild.build.ts
import { defineBuildConfig } from "@workleap/rsbuild-configs";

export default defineBuildConfig();
```

## Try it :rocket:

Start the host application in a development environment using the `dev` script. The pages of the migrated module should render.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] Found 1 local module to register.`
    - `[squide] 1/1 Registering local module.`
    - `[squide] Successfully registered local module.`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/basic).
- Refer to the [troubleshooting](../troubleshooting.md) page.
