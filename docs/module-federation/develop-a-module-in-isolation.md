### Add a new CLI script

Next, add a new `dev-isolated` script to the `package.json` file to start the local development server in **isolation**:

```json !#3 remote-module/package.json
{
    "dev": "webpack serve --config webpack.dev.js",
    "dev-isolated": "cross-env ISOLATED=true webpack serve --config webpack.dev.js",
}
```

!!!tip
If your project's `package.json` file does not already include the [cross-env](https://www.npmjs.com/package/cross-env) dependency, be sure to install `cross-env` as a development dependency.
!!!

The `dev-isolated` script is similar to the `dev` script but introduces an `ISOLATED` environment variable. This variable will be used by the `webpack.dev.js` file to conditionally configure the development server to either serve the module as an application for isolated development or as a remote endpoint by the host application through the `/remoteEntry.js` entry point.

### Configure webpack

First, open the `public/index.html` file created at the beginning of this guide and copy/paste the following [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/) template:

```html host/public/index.html
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
```

Then, open the `.browserslist` file and copy/paste the following content:

``` host/.browserslistrc
extends @workleap/browserslist-config
```

#### Isolated environment configuration

To configure webpack, open the `webpack.dev.js` file and update the configuration to incorporate the `ISOLATED` environment variable and the [defineDevHostConfig](../reference/webpack/defineDevHostConfig.md) function:

```js !#8,11 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig, defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

let config;

if (!process.env.ISOLATED) {
    config = defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
} else {
    config = defineDevHostConfig(swcConfig, "remote1", 8080, []);
}

export default config;
```

!!!tip
If you encounter issues configuring webpack, refer to the [@workleap/webpack-configs](https://workleap.github.io/wl-web-configs/webpack/) documentation.
!!!

### Try it :rocket:

Start the remote module in isolation by running the `dev-isolated` script. The application shell should wrap the pages of the module and the default page should be `DevHome`.

#### Troubleshoot issues

If you are experiencing issues with this section of the guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/basic/remote-module).
- Refer to the [troubleshooting](../troubleshooting.md) page. -->
