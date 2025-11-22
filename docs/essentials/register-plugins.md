---
order: 381
---

# Register plugins

To keep Squide lightweight, not all functionalities should be integrated as a core functionality. However, to accommodate a broad range of technologies, a [plugin system](http://localhost:5001/wl-squide/reference/plugins/plugin/) has been implemented to fill the gap.

## Register a plugin

Plugins can be registered at bootstrapping with the [initializeFirefly](../reference//registration/initializeFirefly.md) function:

```ts !#5
import { initializeFirefly } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

## Retrieve a plugin

Using the [usePlugin](../reference/plugins/usePlugin.md) hook:

```ts !#4
import { usePlugin } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = usePlugin(MyPlugin.name) as MyPlugin;
```

Using the runtime instance:

```ts !#4
import { MyPlugin } from "@sample/my-plugin";

// If the plugin isn't registered, an error is thrown.
const plugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;
```
