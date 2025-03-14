---
order: 740
---

# Add a shared dependency

!!!warning
This guide only applies to federated applications (applications including [remote modules](../reference/registration/registerRemoteModules.md)).
!!!

[Shared dependencies](https://module-federation.io/configure/shared.html) is one of the most powerful concepts of Module Federation. However, mastering its configuration can be quite challenging. **Failure** to configure shared dependencies properly in a federated application using Module Federation can significantly **impact** both **user** and **developer experiences**.

Squide aims to **simplify** the configuration of shared dependencies by abstracting the shared dependencies necessary for building an application with React, React Router, and optionally MSW and i18next. Nevertheless, every federated application will inevitably have to configure additional custom shared dependencies.

For a comprehensive documentation of the Module Federation APIs, their functionality, and their benefits, please refer to this [article](https://www.infoxicator.com/en/module-federation-shared-api).

## Understanding singleton dependencies

A [singleton](https://module-federation.io/configure/shared.html#singleton) shared dependency does exactly what its name suggests: it loads a single instance of a dependency. This means that a dependency will be included in just one bundle file of the federated application.

### Strict versioning

Sometimes, a `singleton` shared dependency is paired with the [strictVersion](https://webpack.js.org/plugins/module-federation-plugin/#strictversion) option:

```js !#10 webpack.config.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevHostConfig(swcConfig, 8080, [], {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true,
            strictVersion: "1.2.1"
        }
    }
});
```

When specified, the `strictVersion` option will generate a **runtime error** if a module attempts to load a **version** of the dependency that is **incompatible** with the specified version. It's **often unnecessary** to use a strict version, and omitting it provides greater flexibility when it comes time to update the shared dependency version.

### Expected behaviors

!!!warning
Please note that Squide's singleton dependency version resolution algorithm **differs** from the native Module Federation behavior. By default, Squide registers a [runtime plugin](https://module-federation.io/plugin/dev/index.html) that customize the resolution of shared dependencies.
!!!

#### Minor or patch version

When the version difference between a host application and a remote module is a **minor** or **patch** version, the higher version of the dependency will be loaded. For example:

- If the host application is on `10.1.0` and a remote module is on `10.1.1` -> `10.1.1` will be loaded
- If the host application is on `10.1.0` and a remote module is on `10.2.0` -> `10.2.0` will be loaded

#### Major version

If the version difference between a host application and a remote module is a **major** version, once again, the higher version of the dependency will be loaded only if it's requested by the host application. For example:

- If the host application is on `11.0.0` and a remote module is on `10.0.0` -> `11.0.0` will be loaded
- If the host application is on `10.0.0` and a remote module is on `11.0.0` -> `10.0.0` will be loaded

#### Additional examples

Let's go through a few additional examples :point_down:

##### Example 1

```
host:        2.0
remote-1:    2.1   <-----
remote-2:    2.0
```

The version requested by `remote-1` is selected because it only represents a **minor** difference from the version requested by the `host` application.

##### Example 2

```
host:        2.0   <-----
remote-1:    3.1
remote-2:    2.0
```

The version requested by the `host` application is selected because `remote-1` is requesting a version with a **major** difference from the one requested by the `host` application.

##### Example 3

```
host:        2.0
remote-1:    3.1
remote-2:    2.1   <-----
```

The version requested by `remote-2` is selected because `remote-1` is requesting a version with a **major** difference from the one requested by the `host` application. Therefore, `remote-2` requests the next highest version, which represents only a **minor** difference from the version requested by the `host` application.

### What should be configured as a shared dependency?

Libraries matching the following criterias are strong candidates to be configured as shared dependencies:

- Medium to large libraries that are used by multiple modules.
- Libraries that requires a [single instance](#react-dependencies-requirements) to work properly (like `react`).
- Libraries exporting [React contexts](#react-context-limitations).

## Understanding eager dependencies

An [eager](https://module-federation.io/configure/shared.html#eager) shared dependency becomes available as soon as the host application starts. In simple terms, it is included in the host application bundle rather than being loaded lazily when it is first requested.

```js !#10 webpack.config.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevHostConfig(swcConfig, 8080, [], {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true,
            eager: true
        }
    }
});
```

The key point to remember about `eager` dependencies is that **only one application or remote module should configure a shared dependency as eager**. Otherwise, the dependency will be included in the bundle of the host application and of every remote module that set the dependency as `eager`.

### What should be configured as an eager dependency?

Any shared dependency that must be loaded to bootstrap the application.

## Default shared dependencies

Since Squide has dependencies on React and React Router, the [define*](../reference/default.md#webpack) functions automatically configure shared dependencies for these packages by default, in addition to Squide own packages. The following shared dependencies are set as [eager](#understanding-eager-dependencies) [singleton](#understanding-singleton-dependencies) by default:

- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router](https://www.npmjs.com/package/react-router)
- [@squide/core](https://www.npmjs.com/package/@squide/core)
- [@squide/react-router](https://www.npmjs.com/package/@squide/react-router)
- [@squide/module-federation](https://www.npmjs.com/package/@squide/module-federation)
- [@squide/msw](https://www.npmjs.com/package/@squide/msw)

For the full shared dependencies configuration, have a look at the [defineConfig.ts](https://github.com/gsoft-inc/wl-squide/blob/main/packages/firefly-webpack-configs/src/defineConfig.ts) file on Github.

> You can [extend](../reference/webpack/defineDevHostConfig.md#extend-a-default-shared-dependency) or [override](../reference/webpack/defineDevHostConfig.md#override-a-default-shared-dependency) the default shared dependencies configuration.

## Add custom shared dependencies

To configure shared dependencies, use the `sharedDependencies` option of any [define*](../reference/default.md#webpack) function:

```js !#7-11 host/webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevHostConfig(swcConfig, 8080, [], {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true
        }
    }
});
```

When a dependency is shared between a host application and a remote module, the sharing options must be **configured on both ends**:

```js !#7-11 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081, {
    sharedDependencies: {
        "@sample/shared": {
            singleton: true
        }
    }
});
```

## React context limitations

For a React context to be provided by the host application and consumed by the remote modules, the library exporting the React context must be set as a `singleton`.

To troubleshoot a React context issue or find more information about the limitations, refer to the [troubleshooting](../troubleshooting.md#react-context-values-are-undefined) page.

## React dependencies requirements

`react` and `react-dom` dependencies must be configured as a `singleton`, otherwise either an error will be thrown at bootstrapping if the loaded `react` versions are incompatible, or features like `useState` will not work.

The `react-router` dependency must as well be configured as a `singleton` because it relies on a global React context that needs to be declared in the host application and is consumed by remote modules.

## Learn more

To learn more about Module Federation shared dependencies read this [article](https://www.infoxicator.com/en/module-federation-shared-api) about the shared APIs and refer to this [POC](https://github.com/patricklafrance/wmf-versioning) on GitHub.
