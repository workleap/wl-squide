---
order: 80
toc:
    depth: 2-3
---

# useEnvironmentVariable

Retrieve a specific environment variable registered with the [FireflyRuntime](../runtime/FireflyRuntime.md) instance.

## Reference

```ts
const variable = useEnvironmentVariable("apiBaseUrl")
```

### Parameters

- `key`: The environment variable key.

### Returns

The environment variable value if there's a match, otherwise an `Error` is thrown.

## Usage

```ts !#3
import { useEnvironmentVariable } from "@squide/firefly";

const apiBaseUrl = useEnvironmentVariable("apiBaseUrl");
```
