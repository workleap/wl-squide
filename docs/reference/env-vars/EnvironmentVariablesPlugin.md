---
order: 100
toc:
    depth: 2-3
---

# EnvironmentVariablesPlugin

A plugin to faciliate the usage of environment variables in a modular application.

## Reference

```ts
const plugin = new EnvironmentVariablesPlugin({ options?: { environmentVariables? } })
```

### Parameters

- `options`: An optional object literal of options:
    - `environmentVariables`: An optional object of environment variables.

## Usage

### Register the plugin

```ts !#4
import { FireflyRuntime, EnvironmentVariablesPlugin } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x)]
});
```

### Register the plugin with initial variables

```ts !#4-8
import { FireflyRuntime, EnvironmentVariablesPlugin } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x, {
        variables: {
            "apiBaseUrl": "https://my-api.com"
        }
    })]
});
```

