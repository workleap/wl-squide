---
order: 90
toc:
    depth: 2-3
---

# getEnvironmentVariablesPlugin

Return an instance of [EnvironmentVariablesPlugin](./EnvironmentVariablesPlugin.md) from the list of plugins registered with a [Runtime](../runtime/FireflyRuntime.md) instance.

## Reference

```ts
const plugin = getEnvironmentVariablesPlugin(runtime)
```

### Parameters

- `runtime`: A runtime instance.

### Returns

An `EnvironmentVariablesPlugin` instance if the plugin has been registered, otherwise an `Error` is thrown.

## Usage

```ts !#3
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";

const plugin = getEnvironmentVariablesPlugin(runtime);
```
