---
order: 900
label: Migrate to Rsbuild
---

# Migrate to Rsbuild

!!!danger
This is an experimental feature.
!!!

[Rsbuild](https://lib.rsbuild.dev/index) is a high-performance build tool powered by [Rspack](https://rspack.dev/), a Rust-based port of [webpack](https://webpack.js.org/) designed for efficiency and speed. Squide firefly introduces a new [@squide/firefly-rsbuild-configs](https://www.npmjs.com/package/@squide/firefly-rsbuild-configs) package to improve it's developer experience with modern web development tooling. This package provides ready-to-use Rsbuild configurations specifically tailored for Squide applications.

To migrate from [@squide/firefly-webpack-configs](https://www.npmjs.com/package/@squide/firefly-webpack-configs) to `@squide/firefly-rsbuild-configs`, based on your project type, read the [reference documentation](../reference/default.md#rsbuild) and execute the following steps :point_down:

## Host application

### Update packages

Open a terminal at the root of the host application project and install the following packages:

+++ pnpm
```bash
pnpm add -D @squide/firefly-rsbuild-configs @rsbuild/core @rspack/core
```
+++ yarn
```bash
yarn add -D @squide/firefly-rsbuild-configs @rsbuild/core @rspack/core
```
+++ npm
```bash
npm install -D @squide/firefly-rsbuild-configs @rsbuild/core @rspack/core
```
+++

Then, in the same terminal, remove the following packages:

+++ pnpm
```bash
pnpm remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++ yarn
```bash
yarn remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++ npm
```bash
npm uninstall @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++

!!!warning
If your host application project uses SWC for tests, you may want to keep the `@swc/core` and `@workleap/swc-configs` packages.
!!!

### Update files

```
host
├── public
├── src
├──── index.ts         -->  X
├──── bootstrap.tsx    -->  index.tsx
├── webpack.dev.js     -->  rsbuild.dev.ts
├── webpack.build.js   -->  rsbuild.build.ts
├── webpack.common.js  -->  rsbuild.common.ts
├── swc.build.js       -->  X
├── swc.dev.js         -->  X
├── package.json
```

#### `webpack.build.js`

Rename the file from `webpack.build.js` to `rsbuild.build.ts`.

Then, open the `rsbuild.build.ts` file and apply the following changes:

- Replace `"@squide/firefly-webpack-configs"` for `"@squide/firefly-rsbuild-configs"`.
- Remove `import { swcConfig } from "./swc.build.js"`.
- Remove the first argument of the `defineBuildHostConfig` function.
- Remove `// @ts-check`.

Before:

```js webpack.build.js
// @ts-check

import { defineBuildHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildHostConfig(swcConfig, []);
```

After:

```ts rsbuild.build.ts
import { defineBuildHostConfig } from "@squide/firefly-rsbuild-configs";

export default defineBuildHostConfig([]);
```

#### `webpack.dev.js`

Rename the file from `webpack.dev.js` to `rsbuild.dev.ts`.

Then, open the `rsbuild.build.ts` file and and apply the following changes:

- Replace `"@squide/firefly-webpack-configs"` for `"@squide/firefly-rsbuild-configs"`.
- Remove `import { swcConfig } from "./swc.build.js"`.
- Remove the first argument of the `defineDevHostConfig` function.
- Remove `// @ts-check`.

Before:

```js webpack.dev.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevHostConfig(swcConfig, 8080, Remotes);
```

After:

```ts rsbuild.dev.ts
import { defineDevHostConfig } from "@squide/firefly-rsbuild-configs";

export default defineDevHostConfig(8080, Remotes);
```

#### `webpack.common.js` (optional)

Rename the file from `webpack.common.js` to `rsbuild.common.ts`.

Then, open the `rsbuild.common.ts` file and and apply the following changes:

- Use typings for `ModuleFederationShared`.
- Use typings for `Features`.
- Remove `// @ts-check`.

Before:

```js webpack.common.js
// @ts-check

export function getSharedDependencies() {
    return {
        "@endpoints/shared": {
            singleton: true,
            eager: true
        }
    };
}

/**
 * @type {import("@squide/firefly-webpack-configs").FireflyFeatures}
 */
export const features = {
    i18next: true,
    environmentVariables: true,
    honeycomb: true
};
```

After:

```ts rsbuild.common.ts
import type { Features, ModuleFederationShared } from "@squide/firefly-rsbuild-configs";

export function getSharedDependencies() {
    return {
        "@endpoints/layouts": {
            singleton: true,
            eager: true
        },
        "@endpoints/shared": {
            singleton: true,
            eager: true
        }
    } as ModuleFederationShared;
}

export const features: Features = {
    i18next: true,
    environmentVariables: true,
    honeycomb: true
};
```

#### `swc.build.js`

Delete the `swc.build.js` file.

#### `swc.dev.js`

Delete the `swc.dev.js` file.

#### `index.ts`

Delete the `index.ts` file.

#### `bootstrap.tsx`

Rename the `bootstrap.tsx` file for `index.tsx`.

### Update scripts

#### `build`

Update the `build` script to run Rsbuild instead of webpack.

Before:

```json package.json
"scripts": {
    "build": "webpack --config webpack.build.js"
}
```

After:

```json package.json
"scripts": {
    "build": "rsbuild build --config rsbuild.build.ts"
}
```

#### `dev`

Update the `dev` script to run Rsbuild instead of webpack.

Before:

```json package.json
"scripts": {
    "dev": "webpack serve --config webpack.dev.js"
}
```

After:

```json package.json
"scripts": {
    "dev": "rsbuild dev --config rsbuild.dev.ts"
}
```

### Try it :rocket:

Start the application in a development environment using the `dev` script. Everything should run smoothly and you should see the homepage of your application. Even if the remote modules of your application are still bundled with webpack, they should be available.

## Remote module

### Update packages

Open a terminal at the root of the remote module project and install the following packages:

+++ pnpm
```bash
pnpm add -D @squide/firefly-rsbuild-configs @rsbuild/core
```
+++ yarn
```bash
yarn add -D @squide/firefly-rsbuild-configs @rsbuild/core
```
+++ npm
```bash
npm install -D @squide/firefly-rsbuild-configs @rsbuild/core
```
+++

Then, in the same terminal, remove the following packages:

+++ pnpm
```bash
pnpm remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++ yarn
```bash
yarn remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++ npm
```bash
npm uninstall @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++

!!!warning
If your remote module project uses SWC for tests, you may want to keep the `@swc/core` and `@workleap/swc-configs` packages.
!!!

### Update files

```
remote-module
├── public
├── src
├── webpack.dev.js     -->  rsbuild.dev.ts
├── webpack.build.js   -->  rsbuild.build.ts
├── webpack.common.js  -->  rsbuild.common.ts
├── swc.build.js       -->  X
├── swc.dev.js         -->  X
├── package.json
```

#### `webpack.build.js`

Rename the file from `webpack.build.js` to `rsbuild.build.ts`.

Then, open the `rsbuild.build.ts` file and apply the following changes:

- Replace `"@squide/firefly-webpack-configs"` for `"@squide/firefly-rsbuild-configs"`.
- Remove `import { swcConfig } from "./swc.build.js"`.
- Remove the first argument of the `defineBuildRemoteModuleConfig` function.
- Remove `// @ts-check`.

Before:

```js webpack.build.js
// @ts-check

import { defineBuildRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.build.js";

export default defineBuildRemoteModuleConfig(swcConfig, "remote1");
```

After:

```ts rsbuild.build.ts
import { defineBuildRemoteModuleConfig } from "@squide/firefly-rsbuild-configs";

export default defineBuildRemoteModuleConfig("remote1");
```

#### `webpack.dev.js`

Rename the file from `webpack.dev.js` to `rsbuild.dev.ts`.

Then, open the `rsbuild.dev.ts` file and apply the following changes:

- Replace `"@squide/firefly-webpack-configs"` for `"@squide/firefly-rsbuild-configs"`.
- Remove `import { swcConfig } from "./swc.dev.js"`.
- Remove the first argument of the `defineDevRemoteModuleConfig` function.
- Remove `// @ts-check`.

Before:

```js webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
```

After:

```ts rsbuild.dev.ts
import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";

export default defineDevRemoteModuleConfig("remote1", 8081);
```

#### `webpack.common.js` (optional)

Rename the file from `webpack.common.js` to `rsbuild.common.ts`.

Then, open the `rsbuild.common.ts` file and and apply the following changes:

- Use typings for `ModuleFederationShared`.
- Use typings for `Features`.
- Remove `// @ts-check`.

Before:

```js webpack.common.js
// @ts-check

export function getSharedDependencies() {
    return {
        "@endpoints/shared": {
            singleton: true,
            eager: true
        }
    };
}

/**
 * @type {import("@squide/firefly-webpack-configs").FireflyFeatures}
 */
export const features = {
    i18next: true,
    environmentVariables: true,
    honeycomb: true
};
```

After:

```ts rsbuild.common.ts
import type { Features, ModuleFederationShared } from "@squide/firefly-rsbuild-configs";

export function getSharedDependencies() {
    return {
        "@endpoints/layouts": {
            singleton: true,
            eager: true
        },
        "@endpoints/shared": {
            singleton: true,
            eager: true
        }
    } as ModuleFederationShared;
}

export const features: Features = {
    i18next: true,
    environmentVariables: true,
    honeycomb: true
};
```

#### `swc.build.js`

Delete the `swc.build.js` file.

#### `swc.dev.js`

Delete the `swc.dev.js` file.

### Update scripts

#### `build`

Update the `build` script to run Rsbuild instead of webpack.

Before:

```json package.json
"scripts": {
    "build": "webpack --config webpack.build.js"
}
```

After:

```json package.json
"scripts": {
    "build": "rsbuild build --config rsbuild.build.ts"
}
```

#### `dev`

Update the `dev` script to run Rsbuild instead of webpack.

Before:

```json package.json
"scripts": {
    "dev": "webpack serve --config webpack.dev.js"
}
```

After:

```json package.json
"scripts": {
    "dev": "rsbuild dev --config rsbuild.dev.ts"
}
```

### Try it :rocket:

Start the host application and the migrated remote module in development mode using the `dev` script. Everything should run smoothly and you should see the homepage of your application. Even if the host application is still bundled with webpack, the application should be available.

## Local module

### Update packages

Open a terminal at the root of the local module project and install the following packages:

+++ pnpm
```bash
pnpm add -D @squide/firefly-rsbuild-configs @rsbuild/core
```
+++ yarn
```bash
yarn add -D @squide/firefly-rsbuild-configs @rsbuild/core
```
+++ npm
```bash
npm install -D @squide/firefly-rsbuild-configs @rsbuild/core
```
+++

Then, in the same terminal, remove the following packages:

+++ pnpm
```bash
pnpm remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++ yarn
```bash
yarn remove @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++ npm
```bash
npm uninstall @squide/firefly-webpack-configs @swc/core @swc/helpers @workleap/swc-configs webpack webpack-cli webpack-dev-server
```
+++

!!!info
If your local module project uses SWC for tests, you may want to keep the `@swc/core` and `@workleap/swc-configs` packages.
!!!

!!!warning
While you can use any package manager to develop an application with Squide, it is highly recommended that you use [PNPM](https://pnpm.io/) as the guides has been developed and tested with PNPM.
!!!

### Update files

```
local-module
├── public
├── src
├── webpack.config.js  -->  rsbuild.config.ts
├── swc.config.js      -->  X
├── package.json
```

#### `webpack.config.js`

Rename the file from `webpack.config.js` to `rsbuild.config.ts`.

Then, open the `rsbuild.config.ts` file and apply the following changes:

- Replace `"@squide/firefly-webpack-configs"` for `"@squide/firefly-rsbuild-configs"`.
- Remove `import { swcConfig } from "./swc.dev.js"`.
- Remove the first argument of the `defineDevRemoteModuleConfig` function.
- Remove `// @ts-check`.

Before:

```js webpack.config.js
// @ts-check

import { defineDevHostConfig } from "@squide/firefly-webpack-configs";
import path from "node:path";
import { swcConfig } from "./swc.config.js";

export default defineDevHostConfig(swcConfig, 8080, [], {
    entry: path.resolve("./src/dev/index.tsx")
});
```

After:

```ts rsbuild.config.ts
import { defineDevHostConfig } from "@squide/firefly-rsbuild-configs";
import path from "node:path";

export default defineDevHostConfig(8080, [], {
    entry: {
        index: path.resolve("./src/dev/index.tsx")
    }
});
```

#### `swc.config.js`

Delete the `swc.config.js` file.

### Update scripts

#### `dev-isolated`

Update the `dev-isolated` script to run Rsbuild instead of webpack.

Before:

```json package.json
"scripts": {
    "dev-isolated": "webpack serve --config webpack.config.js"
}
```

After:

```json package.json
"scripts": {
    "dev-isolated": "rsbuild dev --config rsbuild.config.ts"
}
```

### Try it :rocket:

Start the host application and the migrated local module in development mode using the `dev` script. Everything should run smoothly and you should see the homepage of your application. Even if the host application is still bundled with webpack, the application should be available.

## Sample applications

For additional examples, have a look at Squide's sample applications:

- :icon-mark-github: [basic](https://github.com/workleap/wl-squide/tree/main/samples/basic)
- :icon-mark-github: [endpoints](https://github.com/workleap/wl-squide/tree/main/samples/endpoints)


