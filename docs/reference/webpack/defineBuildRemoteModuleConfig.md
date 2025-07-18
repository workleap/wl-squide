---
order: 70
toc:
    depth: 2-3
---

# defineBuildRemoteModuleConfig

Creates a webpack [configuration object](https://webpack.js.org/concepts/configuration/) that is adapted for a Squide remote module application in **build** mode. This function is a wrapper built on top of [@workleap/webpack-configs](https://www.npmjs.com/package/@workleap/webpack-configs). Make sure to read the [defineBuildConfig](https://workleap.github.io/wl-web-configs/webpack/configure-build/) documentation first.

## Reference

```ts
const webpackConfig = defineBuildRemoteModuleConfig(swcConfig: {}, applicationName, options?: {})
```

## Parameters

- `swcConfig`: An SWC [configuration object](https://swc.rs/docs/configuration/swcrc).
- `applicationName`: The remote module application name.
- `options`: An optional object literal of options:
    - Accepts most of webpack `definedDevConfig` [predefined options](https://workleap.github.io/wl-web-configs/webpack/configure-dev/#3-set-predefined-options).
    - `features`: An optional object literal of feature switches to define additional shared dependencies.
        - `i18next`: Whether or not to add `@squide/i18next` as a shared dependency.
        - `environmentVariables`: Whether or not to add `@squide/env-vars` as a shared dependency.
        - `honeycomb`: Whether or not to add `@squide/firefly-honeycomb` as a shared dependency.
        - `msw`: `false` to remove `@squide/msw` from shared dependencies.
    - `sharedDependencies`: An optional object literal of additional (or updated) module federation shared dependencies.
    - `moduleFederationPluginOptions`: An optional object literal of [ModuleFederationPlugin](https://module-federation.io/configure/index.html) options.

## Returns

A webpack [configuration object](https://webpack.js.org/concepts/configuration/) tailored for a Squide remote module application in build mode.

## Conventions

To fulfill Squide remote module requirements, the `defineBuildRemoteModuleConfig` function will pre-configure the [ModuleFederationPlugin](https://module-federation.io/configure/index.html) with the following `filename` and `exposes` properties.

```js
{
    filename: "/remoteEntry.js",
    exposes: {
        "register.js": "./src/register"
    }
}
```

!!!info
If the remote module `publicPath` is `http://localhost/8081`, the remote module bundle is available at `http://localhost:8081/remoteEntry.js`.
!!!

## Default shared dependencies

The `defineBuildRemoteModuleConfig` function will add the following shared dependencies as `singleton` by default:
- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router](https://www.npmjs.com/package/react-router)
- [@squide/core](https://www.npmjs.com/package/@squide/core)
- [@squide/react-router](https://www.npmjs.com/package/@squide/react-router)
- [@squide/module-federation](https://www.npmjs.com/package/@squide/module-federation)
- [@squide/msw](https://www.npmjs.com/package/@squide/msw)

For the full shared dependencies configuration, have a look at the [defineConfig.ts](https://github.com/workleap/wl-squide/blob/main/packages/firefly-webpack-configs/src/defineConfig.ts) file on Github.

## Usage

### Define a webpack config

```js !#6 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1");
```

### Activate additional features

```js !#7-9 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
    features: {
        i18next: true
    }
});
```

!!!warning
Features must be activated on the host application as well as every remote module.
!!!

### Specify additional shared dependencies

```js !#7-11 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true
        }
    }
});
```

!!!warning
Additional shared dependencies must be configured on the host application as well as every remote module.
!!!

### Extend a default shared dependency

```js !#7-11 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
    sharedDependencies: {
        "react": {
            requiredVersion: "18.2.0"
        }
    }
});
```

In the previous code sample, the `react` shared dependency will be **augmented** with the newly provided `strictVersion` option. The resulting shared dependency will be:

```js !#5
{
    "react": {
        eager: true,
        singleton: true,
        requiredVersion: "18.2.0"
    }
}
```

### Override a default shared dependency

```js !#7-11 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
    sharedDependencies: {
        "react": {
            singleton: false
        }
    }
});
```

In the previous code sample, the `react` shared dependency `singleton` option will be **overrided** by the newly provided value. The resulting shared dependency will be:

```js !#4
{
    "react": {
        eager: true,
        singleton: false
    }
}
```

### Customize module federation configuration

While you could customize the [ModuleFederationPlugin](https://module-federation.io/configure/index.html) configuration by providing your own object literal through the `moduleFederationPluginOptions` option, we recommend using the `defineRemoteModuleFederationPluginOptions(applicationName, options)` function as it will take care of **merging** the custom options with the default plugin options.

```js !#7-9 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig, defineRemoteModuleFederationPluginOptions } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
    moduleFederationPluginOptions: defineRemoteModuleFederationPluginOptions("remote1", {
        runtime: "my-runtime-name"
    })
});
```

- `applicationName`: The host application name.
- `moduleFederationPluginOptions`: An object literal of [ModuleFederationPlugin](https://module-federation.io/configure/index.html) options.

### Expose an additional module

```js !#7-11 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig, defineRemoteModuleFederationPluginOptions } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1", {
        moduleFederationPluginOptions: defineRemoteModuleFederationPluginOptions("remote1", {
            exposes: {
                "./foo": "./src/bar"
            }
        })
});
```
