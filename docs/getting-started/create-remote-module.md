---
order: 90
---

# Create a remote module

!!!info Use an existing template

We highly recommend going through the entire getting started guide. However, if you prefer to scaffold the application we'll be building, a template is available with [degit](https://github.com/Rich-Harris/degit):

```bash
corepack pnpm dlx degit https://github.com/gsoft-inc/wl-squide/templates/getting-started
```
!!!

Remote modules are modules that are not included in the host application build but are instead **loaded at runtime** from a remote server. They provide a way for teams to be **fully autonomous** by **independently deploying** their modules without relying on the other parts of the application.

Let's add our first remote module!

## Install the packages

Create a new application (we'll refer to ours as `remote-module`), then open a terminal at the root of the new solution and install the following packages:

+++ pnpm
```bash
pnpm add -D @workleap/swc-configs @workleap/browserslist-config @squide/firefly-webpack-configs webpack webpack-dev-server webpack-cli @swc/core @swc/helpers browserslist postcss @types/react @types/react-dom
pnpm add @squide/firefly react react-dom react-router @tanstack/react-query
```
+++ yarn
```bash
yarn add -D @workleap/swc-configs @workleap/browserslist-config @squide/firefly-webpack-configs webpack webpack-dev-server webpack-cli @swc/core @swc/helpers browserslist postcss @types/react @types/react-dom
yarn add @squide/firefly react react-dom react-router @tanstack/react-query
```
+++ npm
```bash
npm install -D @workleap/swc-configs @workleap/browserslist-config @squide/firefly-webpack-configs webpack webpack-dev-server webpack-cli @swc/core @swc/helpers browserslist postcss @types/react @types/react-dom
npm install @squide/firefly react react-dom react-router @tanstack/react-query
```
+++

!!!warning
While you can use any package manager to develop an application with Squide, it is highly recommended that you use [PNPM](https://pnpm.io/) as the guides has been developed and tested with PNPM.
!!!

## Setup the application

First, create the following files:

```
remote-module
├── src
├──── register.tsx
├──── Page.tsx
├── .browserslistrc
├── swc.dev.js
├── swc.build.js
├── webpack.dev.js
├── webpack.build.js
├── package.json
```

Then, ensure that you are developing your module using [ESM syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) by specifying `type: module` in your `package.json` file:

```json remote-module/package.json
{
    "type": "module"
}
```

### Routes registration

Next, register the remote module routes and navigation items with the [registerRoute](/reference/runtime/runtime-class.md#register-routes) and [registerNavigationItem](/reference/runtime/runtime-class.md#register-navigation-items) functions:

```tsx !#5-8,10-14 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/remote/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "remote-page",
        $label: "Remote/Page",
        to: "/remote/page"
    });
}
```

Then, create the `Page` component:

```tsx remote-module/src/Page.tsx
export function Page() {
    return (
        <div>Hello from Remote/Page!</div>
    );
}
```

## Configure webpack

!!!info
Squide webpack configuration is built on top of [@workleap/webpack-configs](https://gsoft-inc.github.io/wl-web-configs/webpack/), [@workleap/browserslist-config](https://gsoft-inc.github.io/wl-web-configs/browserslist/) and [@workleap/swc-configs](https://gsoft-inc.github.io/wl-web-configs/swc/). If you are having issues with the configuration of these tools, refer to the tools documentation websites.
!!!

### Development configuration

To configure webpack for a **development** environment, first open the `swc.dev.js` file and copy/paste the following code:

```js remote-module/swc.dev.js
// @ts-check

import { browserslistToSwc, defineDevConfig } from "@workleap/swc-configs";

const targets = browserslistToSwc();

export const swcConfig = defineDevConfig(targets);
```

Then, open the `webpack.dev.js` file and use the [defineDevRemoteModuleConfig](/reference/webpack/defineDevRemoteModuleConfig.md) function to configure webpack:

```js !#6 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
```

> If you are having issues with the wepack configuration that are not related to module federation, refer to the [@workleap/webpack-configs](https://gsoft-inc.github.io/wl-web-configs/webpack/configure-dev/) documentation.

### Build configuration

To configure webpack for a **build** environment, first open the `swc.build.js` file and copy/paste the following code:

```js remote-module/swc.build.js
// @ts-check

import { browserslistToSwc, defineBuildConfig } from "@workleap/swc-configs";

const targets = browserslistToSwc();

export const swcConfig = defineBuildConfig(targets);
```

Then, open the `webpack.build.js` file and use the [defineBuildRemoteModuleConfig](/reference/webpack/defineBuildRemoteModuleConfig.md) function to configure webpack:

```js !#6 remote-module/webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1");
```

> If you are having issues with the wepack configuration that are not related to module federation, refer to the [@workleap/webpack-configs](https://gsoft-inc.github.io/wl-web-configs/webpack/configure-build/) documentation.

## Add CLI scripts

To initiate the development server, add the following script to the application `package.json` file:

```json remote-module/package.json
{
    "dev": "webpack serve --config webpack.dev.js"
}
```

To build the module, add the following script to the application `package.json` file:

```json remote-module/package.json
{
    "build": "webpack --config webpack.build.js"
}
```

## Try it :rocket:

Start the `host` and the `remote-module` applications in development mode using the `dev` script. You should notice an additional link labelled `Remote/Page` in the navigation menu. Click on the link to navigate to the page of your new **remote** module!

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] The following route has been registered.`
    - `[squide] The following static navigation item has been registered to the "root" menu for a total of 2 static items.`
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/basic/remote-module).
- Refer to the [troubleshooting](../troubleshooting.md) page.

