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


<!-- ## Setup a remote module

With the new `shell` package in place, we can now configure the remote module to be developed in isolation. The goal is to start the module development server and render the module pages with the same layout and functionalities as if it was rendered by the host application.

To begin, let's start by adding a dependency to the `@sample/shell` package:

```json remote-module/package.json
{
    "dependencies": {
        "@sample/shell": "0.0.1"
    }
}
```

Then, create the following files in the remote module application:

``` !#2-3,5-7,10-11
remote-module
├── public
├──── index.html
├── src
├────── dev
├────────── DevHome.tsx
├────────── register.tsx
├────── register.tsx
├────── Page.tsx
├────── index.tsx
├────── App.tsx
├── webpack.dev.js
├── package.json
```

### index.tsx

The `index.tsx` file is similar to the `bootstrap.tsx` file of an host application but, tailored for an isolated module. The key distinctions are that all the modules are registered as local modules, and a new `registerDev` function is introduced to register the development homepage (which will be covered in an upcoming section):

```tsx !#8-13 remote-module/src/index.tsx
import { createRoot } from "react-dom/client";
import { ConsoleLogger, FireflyProvider, initializeFirefly } from "@squide/firefly";
import { App } from "./App.tsx";
import { register as registerModule } from "./register.tsx";
import { registerDev } from "./dev/register.tsx";
import { registerShell } from "@sample/shell";

const runtime = initializeFirefly(runtime, {
    // Registering the remote module as a local module because the "register" function 
    // is local when developing in isolation.
    localModules: [registerModule, registerDev, registerShell],
    loggers: [x => new ConsoleLogger(x)]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### App.tsx

The `App.tsx` file uses the newly created `AppRouter` component to setup Squide's primitives with a [React Router](https://reactrouter.com/) instance:

```tsx remote-module/src/App.tsx
import { AppRouter } from "@sample/shell";

export function App() {
    return (
        <AppRouter />
    );
}
```

### DevHome.tsx

The `DevHome` component is the homepage when the remote module is developed in isolation:

```tsx remote-module/src/dev/DevHome.tsx
function DevHome() {
    return (
        <div>
            <h2>Remote module development home page</h2>
            <p>Hey!</p>
        </div>
    );
}
```

To register the development homepage, create a new local module specifically for configuring the remote during isolated development:

```tsx remote-module/src/dev/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { DevHome } from "./DevHome.tsx";

export const registerDev: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        index: true,
        element: <DevHome />
    });
}
```

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

