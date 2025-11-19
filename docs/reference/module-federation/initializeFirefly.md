---
order: 100
toc:
    depth: 2-3
---

# initializeFirefly

!!!info
This function is a wrapper around the original [initializeFirefly](../registration/initializeFirefly.md) function, adapted for use with Module Federation. This page documents only the differences between the original function and this adapted version.
!!!

## Reference

```ts
const runtime = initializeFirefly(options?: { localModules?, remotes?, startMsw?, onError?, context?, mode?, useMsw?, loggers?, plugins? })
```

### Parameters

- `options`: An optional object literal of options:
    - `remotes`: An optional array of [RemoteDefinition](#remote-definition).

### Returns

A [FireflyRuntime](../runtime/runtime-class.md) instance.

## Usage

### Register a remote module

```tsx !#6-8,11 host/src/bootstrap.tsx
import { FireflyProvider } from "@squide/firefly";
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly-module-federation";
import { createRoot } from "react";
import { App } from "./App.tsx";

const Remotes: RemoteDefinition = [
    { name: "remote1" }
];

const runtime = initializeFirefly({
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

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

## Remote definition

To ease the configuration of remote modules, make sure that you first import the `RemoteDefinition` type and assign it to your remote definitions array declaration.

```ts !#3 host/src/bootstrap.tsx
import type { RemoteDefinition } from "@squide/firefly";

const Remotes: RemoteDefinition = [
    { name: "remote1" }
];
```

### `name`

The `name` option of a remote definition **must match** the `name` option defined in the remote module [ModuleFederationPlugin](https://module-federation.io/configure/index.html) configuration.

If you are using either the Squide [defineDevRemoteModuleConfig](../webpack/defineDevRemoteModuleConfig.md) or [defineBuildRemoteModuleConfig](../webpack/defineBuildRemoteModuleConfig.md) functions to add the `ModuleFederationPlugin` to the remote module webpack [configuration object](https://module-federation.io/), then the remote module `name` is the second argument of the function.

In the following exemple, the remote module `name` is `remote1`.

```ts !#2 host/src/bootstrap.tsx
const Remotes: RemoteDefinition = [
    { name: "remote1" }
];
```

```js !#6 remote-module/webpack.dev.js
// @ts-check

import { defineDevRemoteModuleConfig } from "@squide/firefly-webpack-configs";
import { swcConfig } from "./swc.dev.js";

export default defineDevRemoteModuleConfig(swcConfig, "remote1", 8081);
```
