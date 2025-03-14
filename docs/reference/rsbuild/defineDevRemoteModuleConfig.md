---
order: 90
toc:
    depth: 2-3
---

# defineDevRemoteModuleConfig

!!!danger
This is an experimental feature.
!!!

Creates an Rsbuild [configuration object](https://rsbuild.dev/config/index) that is adapted for a Squide remote module application in **development** mode. This function is a wrapper built on top of [@workleap/rsbuild-configs](https://www.npmjs.com/package/@workleap/rsbuild-configs). Make sure to read the [defineDevConfig](https://gsoft-inc.github.io/wl-web-configs/rsbuild/configure-dev/) documentation first.

## Reference

```ts
const rsbuildConfig = defineDevRemoteModuleConfig(applicationName, port, options?: {})
```

## Parameters

- `applicationName`: The remote module application name.
- `port`: The remote module application port.
- `options`: An optional object literal of options:
    - Accepts most of Rsbuild `definedDevConfig` [predefined options](https://gsoft-inc.github.io/wl-web-configs/rsbuild/configure-dev/#3-set-predefined-options).
    - `features`: An optional object literal of feature switches to define additional shared dependencies.
        - `i18next`: Whether or not to add `@squide/i18next` as a shared dependency.
        - `environmentVariables`: Whether or not to add `@squide/env-vars` as a shared dependency.
        - `honeycomb`: Whether or not to add `@squide/firefly-honeycomb` as a shared dependency.
        - `msw`: `false` to remove `@squide/msw` from shared dependencies.
    - `sharedDependencies`: An optional object literal of additional (or updated) module federation shared dependencies.
    - `moduleFederationPluginOptions`: An optional object literal of [ModuleFederationPlugin](https://module-federation.io/configure/index.html) options.

## Returns

An Rsbuild [configuration object](https://rsbuild.dev/config/index) tailored for a Squide remote module application in development mode.

## Conventions

To fulfill Squide remote module requirements, the `defineDevRemoteModuleConfig` function will pre-configure the [ModuleFederationPlugin](https://module-federation.io/configure/index.html) with the following `filename` and `exposes` properties.

```ts
{
    filename: "/remoteEntry.js",
    exposes: {
        "register.js": "./src/register"
    }
}
```

!!!info
If the remote module `port` is `8081`, the remote module bundle is available at `http://localhost:8081/remoteEntry.js`.
!!!

## Default shared dependencies

The `defineDevRemoteModuleConfig` function will add the following shared dependencies as `singleton` by default:
- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router](https://www.npmjs.com/package/react-router)
- [@squide/core](https://www.npmjs.com/package/@squide/core)
- [@squide/react-router](https://www.npmjs.com/package/@squide/react-router)
- [@squide/module-federation](https://www.npmjs.com/package/@squide/module-federation)
- [@squide/msw](https://www.npmjs.com/package/@squide/msw)

For the full shared dependencies configuration, have a look at the [defineConfig.ts](https://github.com/gsoft-inc/wl-squide/blob/main/packages/firefly-rsbuild-configs/src/defineConfig.ts) file on Github.

## Usage

### Define a webpack config

```ts remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080);
```

### Activate additional features

```ts !#4-6 remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080, {
    features: {
        i18next: true
    }
});
```

!!!info
Features must be activated on the host application as well as every remote module.
!!!

### Specify additional shared dependencies

```ts !#4-8 remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080, {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true
        }
    }
});
```

!!!info
Additional shared dependencies must be configured on the host application as well as every remote module.
!!!

### Extend a default shared dependency

```ts !#4-8 remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080, {
    sharedDependencies: {
        "react": {
            requiredVersion: "18.2.0"
        }
    }
});
```

In the previous code sample, the `react` shared dependency will be **augmented** with the newly provided `strictVersion` option. The resulting shared dependency will be:

```ts !#5
{
    "react": {
        eager: true,
        singleton: true,
        requiredVersion: "18.2.0"
    }
}
```

### Override a default shared dependency

```ts !#4-8 remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080, {
    sharedDependencies: {
        "react": {
            singleton: false
        }
    }
});
```

In the previous code sample, the `react` shared dependency `singleton` option will be **overrided** by the newly provided value. The resulting shared dependency will be:

```ts !#4
{
    "react": {
        eager: true,
        singleton: false
    }
}
```

### Customize module federation configuration

```ts !#4-8 remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080, {
    moduleFederationPluginOptions: defaultOptions => {
        defaultOptions.name = "my-application";

        return defaultOptions;
    }
});
```

### Expose an additional module

```ts !#4-11 remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8080, {
    moduleFederationPluginOptions: defaultOptions => {
        defaultOptions.exposes = {
            ...(defaultOptions.exposes ?? {}),
            "./foo": "./src/bar"
        }

        return defaultOptions;
    }
});
```
