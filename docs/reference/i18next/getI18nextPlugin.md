---
order: 90
toc:
    depth: 2-3
---

# getI18nextPlugin

Return an instance of [i18nextPlugin](../i18next/i18nextPlugin.md) from the list of plugins registered with a [Runtime](../runtime/runtime-class.md) instance.

## Reference

```ts
const plugin = getI18nextPlugin(runtime)
```

### Parameters

- `runtime`: A runtime instance.

### Returns

An `i18nextPlugin` instance if the plugin has been registered, otherwise an `Error` is thrown.

## Usage

```ts !#3
import { getI18nextPlugin } from "@squide/i18next";

const plugin = getI18nextPlugin(runtime);
```

