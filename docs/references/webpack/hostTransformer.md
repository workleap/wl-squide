# hostTransformer

Add to an existing Webpack [configuration object](https://webpack.js.org/concepts/configuration/) a [ModuleFederationPlugin](https://webpack.js.org/plugins/module-federation-plugin/) plugin instance pre-configured for a `@squide` host application.

## Reference

```ts
const federatedConfig = hostTransformer(config, name, options?: { router?, pluginOptions? })
```

### Parameters

- `config`: A Webpack [configuration object](https://webpack.js.org/concepts/configuration/).
- `name`: The host application name.
- `options`: An optional object literal of options.
    - `router`: An optional router identifier (default is `"react-router"`).
    - `pluginOptions`: An optional object literal of [ModuleFederationPlugin](https://webpack.js.org/plugins/module-federation-plugin/) options.

### Returns

A Webpack [configuration object](https://webpack.js.org/concepts/configuration/) enriched with a [ModuleFederationPlugin](https://webpack.js.org/plugins/module-federation-plugin/) plugin instance.

## Default shared dependencies

The `hostTransformer` function will add the following shared dependencies as `singleton` by default:
- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router-dom](https://www.npmjs.com/package/react-router-dom)
- [@squide/core](https://www.npmjs.com/package/@squide/core)
- [@squide/react-router](https://www.npmjs.com/package/@squide/react-router)
- [@squide/webpack-module-federation](https://www.npmjs.com/package/@squide/webpack-module-federation)

For the full shared dependencies configuration, have a look at the [configTransformer.ts](https://github.com/gsoft-inc/wl-squide/blob/main/packages/webpack-module-federation/src/configTransformer.ts) file on Github.

## Usage

### Transform a Webpack config

```js !#10 host/webpack.config.js
import { hostTransformer } from "@squide/webpack-module-federation/configTransformer.js";

/** @type {import("webpack").Configuration} */
const webpackConfig = {
    target: "web",
    entry: "./src/index.ts",
    ...
};

const federatedConfig = hostTransformer(config, "host");

export default federatedConfig;
```

### Specify additional shared dependencies

!!!info
Additional shared dependencies must be configured on the host application as well as every remote module.
!!!

```js !#11-17 host/webpack.config.js
import { hostTransformer } from "@squide/webpack-module-federation/configTransformer.js";

/** @type {import("webpack").Configuration} */
const config = {
    target: "web",
    entry: "./src/index.ts",
    ...
};

const federatedConfig = hostTransformer(config, "host", {
    pluginOptions: {
        shared: {
            "@sample/shared": {
                singleton: true
            }
        }
    }
});

export default federatedConfig;
```

### Override a default shared dependency

```js !#13-15 host/webpack.config.js
import { hostTransformer } from "@squide/webpack-module-federation/configTransformer.js";

/** @type {import("webpack").Configuration} */
const config = {
    target: "web",
    entry: "./src/index.ts",
    ...
};

const federatedConfig = hostTransformer(config, "host", {
    pluginOptions: {
        shared: {
            "react": {
                strictVersion: "18.2.0"
            }
        }
    }
});

export default federatedConfig;
```
