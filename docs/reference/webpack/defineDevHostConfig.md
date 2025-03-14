---
order: 100
toc:
    depth: 2-3
---

# defineDevHostConfig

Creates a webpack [configuration object](https://webpack.js.org/concepts/configuration/) that is adapted for a Squide host application in **development** mode. This function is a wrapper built on top of [@workleap/webpack-configs](https://www.npmjs.com/package/@workleap/webpack-configs). Make sure to read the [defineDevConfig](https://gsoft-inc.github.io/wl-web-configs/webpack/configure-dev/) documentation first.

!!!info
If the application _**does not**_ not include any remote modules, use the [defineDevConfig](https://gsoft-inc.github.io/wl-web-configs/webpack/configure-dev/) function instead of `defineDevHostConfig`.
!!!

## Reference

```ts
const webpackConfig = defineDevHostConfig(swcConfig: {}, port, remotes: [], options?: {})
```

## Parameters

- `swcConfig`: An SWC [configuration object](https://swc.rs/docs/configuration/swcrc).
- `port`: The host application port.
- `remotes`: An array of `RemoteDefinition` (view the [Remote definition](#remote-definition) section).
- `options`: An optional object literal of options:
    - Accepts most of webpack `definedDevConfig` [predefined options](https://gsoft-inc.github.io/wl-web-configs/webpack/configure-dev/#3-set-predefined-options).
    - `htmlWebpackPluginOptions`: An optional object literal accepting any options of the [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin#options).
    - `features`: An optional object literal of feature switches to define additional shared dependencies.
        - `i18next`: Whether or not to add `@squide/i18next` as a shared dependency.
        - `environmentVariables`: Whether or not to add `@squide/env-vars` as a shared dependency.
        - `honeycomb`: Whether or not to add `@squide/firefly-honeycomb` as a shared dependency.
        - `msw`: `false` to remove `@squide/msw` from shared dependencies.
    - `sharedDependencies`: An optional object literal of additional (or updated) module federation shared dependencies.
    - `moduleFederationPluginOptions`: An optional object literal of [ModuleFederationPlugin](https://module-federation.io/configure/index.html) options.

## Returns

A webpack [configuration object](https://webpack.js.org/concepts/configuration/) tailored for a Squide host application in development mode.

## Default shared dependencies

The `defineDevHostConfig` function will add the following shared dependencies as `singleton` by default:
- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router](https://www.npmjs.com/package/react-router)
- [@squide/core](https://www.npmjs.com/package/@squide/core)
- [@squide/react-router](https://www.npmjs.com/package/@squide/react-router)
- [@squide/module-federation](https://www.npmjs.com/package/@squide/module-federation)
- [@squide/msw](https://www.npmjs.com/package/@squide/msw)

For the full shared dependencies configuration, have a look at the [defineConfig.ts](https://github.com/gsoft-inc/wl-squide/blob/main/packages/firefly-webpack-configs/src/defineConfig.ts) file on Github.

## Usage

### Define a webpack config

```js !#13 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, Remotes);
```

### Activate optional features

```js !#14-16 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, Remotes, {
    features: {
        i18next: true
    }
});
```

!!!info
Features must be activated on the host application as well as every remote module.
!!!

### Specify additional shared dependencies

```js !#14-18 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, Remotes, {
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

```js !#14-18 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, Remotes, {
    sharedDependencies: {
        "react": {
            requiredVersion: "18.2.0"
        }
    }
});
```

In the previous code sample, the `react` shared dependency will be **augmented** with the `strictVersion` option. The resulting shared dependency will be:

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

```js !#14-18 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, {
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

While you could customize the [ModuleFederationPlugin](https://module-federation.io/configure/) configuration by providing your own object literal through the `moduleFederationPluginOptions` option, we recommend using the `defineHostModuleFederationPluginOptions(options)` function as it will take care of **merging** the custom options with the default plugin options.

```js !#14-16 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig, defineHostModuleFederationPluginOptions } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(swcConfig, 8080, Remotes, {
    moduleFederationPluginOptions: defineHostModuleFederationPluginOptions({
        runtime: "my-runtime-name"
    })
});
```

- `applicationName`: The host application name.
- `moduleFederationPluginOptions`: An object literal of [ModuleFederationPlugin](https://module-federation.io/configure/) options.

## Remote definition

### `name`

The `name` option of a remote definition **must match** the `name` option defined in the remote module [ModuleFederationPlugin](https://module-federation.io/configure/index.html) configuration.

If you are relying on the Squide [defineDevRemoteModuleConfig](./defineDevRemoteModuleConfig.md) function to add the `ModuleFederationPlugin` to the remote module webpack [configuration object](https://webpack.js.org/concepts/configuration/), then the remote module `name` is the second argument of the function.

In the following exemple, the remote module `name` is `remote1`.

```js !#5 host/webpack.dev.js
/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: `http://localhost:8081` }
];
```

```js !#6 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
```

### `url`

The `url` option of a remote definition **must match** the [publicPath](https://webpack.js.org/guides/public-path/) of the remote module webpack [configuration object](https://webpack.js.org/concepts/configuration/).

In the following exemple, the remote module `publicPath` is `http://localhost:8081`.

```ts !#5 host/webpack.dev.js
/**
 * @typedef {import("@squide/firefly-webpack-configs").RemoteDefinition[]}
 */
const Remotes = [
    { name: "remote1", url: "http://localhost:8081" }
];
```

The `publicPath` is built from the provided `host` and `port` values. Therefore, if the port value is `8081`, then the generated `publicPath` would be `http://localhost:8081`:

```js !#6-8 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081, {
    host: "localhost" // (This is the default value)
});
```


