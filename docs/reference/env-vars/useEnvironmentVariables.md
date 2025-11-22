---
order: 70
toc:
    depth: 2-3
---

# useEnvironmentVariables

Retrieve all the environment variables registered with the [FireflyRuntime](../runtime/FireflyRuntime.md) instance.

## Reference

```ts
const variables = useEnvironmentVariables()
```

### Parameters

None

### Returns

Returns all registered environment variables as an object literal. If no environment variables are registered, an empty object literal is returned.

## Usage

```ts !#3
import { useEnvironmentVariables } from "@squide/firefly";

const variables = useEnvironmentVariables();
```
