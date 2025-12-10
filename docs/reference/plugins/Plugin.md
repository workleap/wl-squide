---
order: 100
toc:
    depth: 2-3
---

# Plugin

An abstract base class to define a plugin.

## Parameters

- `runtime`: A runtime instance.

## Protected members

- `_runtime`: Access the plugin `Runtime` instance.

## Getters

- `name`: Return the name of the plugin.

## Usage

### Define a plugin

```ts !#3-7 my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }
}
```

### Register a plugin

```ts !#5
import { FireflyRuntime } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = new FireflyRuntime({
    plugins: [x => new MyPlugin(x)]
});
```

### Use a plugin runtime instance

```ts !#9 my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }

    sayHello() {
        this._runtime.logger.debug("Hello!");
    }
}
```

### Retrieve a plugin from a runtime instance

```ts !#3
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;
```

### Retrieve a plugin with a custom function

We recommend pairing a plugin definition with a custom function to retrieve the plugin from a runtime instance.

```ts !#9-11 my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }
}

export function getMyPlugin(runtime: FireflyRuntime) {
    return runtime.getPlugin(MyPlugin.name) as MyPlugin;
}
```

```ts !#3
import { getMyPlugin } from "@sample/my-plugin";

const myPlugin = getMyPlugin(runtime);
```

Retrieving a plugin with a custom function doesn't require the consumer to remember the plugin name, and has the upside of inferring the typings.
