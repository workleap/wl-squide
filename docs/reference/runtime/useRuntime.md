---
order: 80
toc:
    depth: 2-3
---

# useRuntime

Retrieve a `FireflyRuntime` instance.

!!!info
Consider using [useRoutes](./useRoutes.md), [useNavigationItems](./useNavigationItems.md), [useLogger](./useLogger.md) instead of `useRuntime`.
!!!

## Reference

```ts
const runtime = useRuntime()
```

### Parameters

None

### Returns

A `FireflyRuntime` instance.

## Usage

```ts !#3
import { useRuntime } from "@squide/firefly";

const runtime = useRuntime();

runtime.logger.debug("Hello!");
```
