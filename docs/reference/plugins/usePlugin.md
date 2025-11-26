---
order: 90
toc:
    depth: 2-3
---

# usePlugin

Retrieve a plugin from the `FireflyRuntime` instance.

## Reference

```ts
const plugin = usePlugin(pluginName)
```

### Parameters

- `pluginName`: The name of the plugin.

### Returns

A plugin instance if the plugin has been registered, otherwise an `Error` is thrown.

## Usage

```ts !#4
import { usePlugin } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = usePlugin(MyPlugin.name);
```
