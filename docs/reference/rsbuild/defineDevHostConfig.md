---
order: 100
toc:
    depth: 2-3
---

# defineDevHostConfig

!!!danger
This is an experimental feature.
!!!

Creates an Rsbuild [configuration object](https://rsbuild.dev/config/index) that is adapted for a Squide host application in **development** mode. This function is a wrapper built on top of [@workleap/rsbuild-configs](https://www.npmjs.com/package/@workleap/rsbuild-configs). Make sure to read the [defineDevConfig](https://gsoft-inc.github.io/wl-web-configs/rsbuild/configure-dev/) documentation first.

!!!info
If the application _**does not**_ not include any remote modules, use the [defineDevConfig](https://gsoft-inc.github.io/wl-web-configs/rsbuild/configure-dev/) function instead of `defineDevHostConfig`.
!!!

## Reference

```ts
const rsbuildConfig = defineDevHostConfig(port, remotes: [], options?: {})
```

## Parameters

- `port`: The host application port.
- `remotes`: An array of `RemoteDefinition` (view the [Remote definition](#remote-definition) section).
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

An Rsbuild [configuration object](https://rsbuild.dev/config/index) tailored for a Squide host application in development mode.

## Default shared dependencies

The `defineDevHostConfig` function will add the following shared dependencies as `singleton` by default:
- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router](https://www.npmjs.com/package/react-router)
- [@squide/core](https://www.npmjs.com/package/@squide/core)
- [@squide/react-router](https://www.npmjs.com/package/@squide/react-router)
- [@squide/module-federation](https://www.npmjs.com/package/@squide/module-federation)
- [@squide/msw](https://www.npmjs.com/package/@squide/msw)

For the full shared dependencies configuration, have a look at the [defineConfig.ts](https://github.com/gsoft-inc/wl-squide/blob/main/packages/firefly-rsbuild-configs/src/defineConfig.ts) file on Github.

## Usage

### Define an Rsbuild config

```ts !#7 host/rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(8080, Remotes);
```

### Activate optional features

```ts !#8-10 host/rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(8080, Remotes, {
    features: {
        i18next: true
    }
});
```

!!!info
Features must be activated on the host application as well as every remote module.
!!!

### Specify additional shared dependencies

```ts !#8-12 host/rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(8080, Remotes, {
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

```ts !#8-12 host/rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(8080, Remotes, {
    sharedDependencies: {
        "react": {
            requiredVersion: "18.2.0"
        }
    }
});
```

In the previous code sample, the `react` shared dependency will be **augmented** with the `strictVersion` option. The resulting shared dependency will be:

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

```ts !#8-12 host/rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(8080, {
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

```ts !#8-12 host/rsbuild.dev.ts
import { defineDevHostConfig, type RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];

export default defineDevHostConfig(8080, Remotes, {
    moduleFederationPluginOptions: defaultOptions => {
        defaultOptions.name = "my-application";

        return defaultOptions;
    }
});
```

## Remote definition

### `name`

The `name` option of a remote definition **must match** the `name` option defined in the remote module [ModuleFederationPlugin](https://module-federation.io/configure/index.html) configuration.

If you are relying on the Squide [defineDevRemoteModuleConfig](./defineDevRemoteModuleConfig.md) function to add the `ModuleFederationPlugin` to the remote module Rsbuild [configuration object](https://rsbuild.dev/config/index), then the remote module `name` is the first argument of the function.

In the following exemple, the remote module `name` is `remote1`.

```ts !#4 host/rsbuild.dev.ts
import type { RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: `http://localhost:8081` }
];
```

```ts remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8081);
```

### `url`

The `url` option of a remote definition **must match** the [assetPrefix](https://rsbuild.dev/config/output/asset-prefix) of the remote module Rsbuild [configuration object](https://rsbuild.dev/config/index).

In the following exemple, the remote module `assetPrefix` is `http://localhost:8081`.

```ts !#4 host/rsbuild.dev.ts
import type { RemoteDefinition } from "@squide/firefly-rsbuild-configs";

const Remotes: RemoteDefinition[] = [
    { name: "remote1", url: "http://localhost:8081" }
];
```

The `assetPrefix` is built from the provided `host` and `port` values. Therefore, if the port value is `8081`, then the generated `assetPrefix` would be `http://localhost:8081`:

```ts remote-module/rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevRemoteModuleConfig("remote1", 8081, {
    host: "localhost" // (This is the default value)
});
```


