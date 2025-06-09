---
order: 100
toc:
    depth: 2-3
---

# EnvironmentVariablesPlugin

A plugin to faciliate the usage of environment variables in a modular application.

## Reference

```ts
const plugin = new EnvironmentVariablesPlugin()
```

### Parameters

None

## Usage

!!!tip
Make sure to [augment](../../guides/use-environment-variables.md#module-augmentation) the `EnvironmentVariables` TypeScript interface with the variables of your module.
!!!

### Register the plugin

```ts !#5
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x)]
});
```

### Retrieve the plugin instance

```ts
import { EnvironmentVariablesPlugin, EnvironmentVariablesPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(EnvironmentVariablesPluginName) as EnvironmentVariablesPlugin;
```

[!ref Prefer using `getEnvironmentVariablesPlugin` when possible](./getEnvironmentVariablesPlugin.md)

### Register an environment variable

```ts !#5
import { EnvironmentVariablesPlugin, EnvironmentVariablesPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(EnvironmentVariablesPluginName) as EnvironmentVariablesPlugin;

plugin.registerVariable("apiBaseUrl", "https://my-api.com");
```

> An environment variable with the same key can be registered multiple times (e.g., by multiple modules) as long as the value remains the same. If the value differs, an `Error` will be thrown.

### Register multiple environment variables at once

```ts !#5-8
import { EnvironmentVariablesPlugin, EnvironmentVariablesPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(EnvironmentVariablesPluginName) as EnvironmentVariablesPlugin;

plugin.registerVariables({
    apiBaseUrl: "https://my-api.com",
    loginPageUrl: "https://login.com"
});
```

### Retrieve a single environment variable

```ts !#5
import { EnvironmentVariablesPlugin, EnvironmentVariablesPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(EnvironmentVariablesPluginName) as EnvironmentVariablesPlugin;

const apiBaseUrl = plugin.getVariable("apiBaseUrl");
```

### Retrieve all the environment variables

```ts !#5
import { EnvironmentVariablesPlugin, EnvironmentVariablesPluginName } from "@squide/i18next";

const plugin = runtime.getPlugin(EnvironmentVariablesPluginName) as EnvironmentVariablesPlugin;

const variables = plugin.getVariables();
```
