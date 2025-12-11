---
order: 100
---

# MswPlugin

A plugin to faciliate the integration of [Mock Service Worker](https://mswjs.io/) (MSW) in a modular application.

## Reference

```ts
const plugin = new MswPlugin(runtime, options?: { mswState? })
```

### Parameters

- `runtime`: A runtime instance.
- `options`: An optional object literal of options:
    - `mswState`: An `MswState` instance.

## Usage

### Register the plugin

```ts !#4
import { FireflyRuntime, MswPlugin } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => new MswPlugin(x)]
});
```

### Register the plugin with an initial state

```ts !#4-8
import { FireflyRuntime, MswPlugin, MswState } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => new MswPlugin(x, {
        state: new MswState({
            isReady: true
        }) 
    })]
});
```

