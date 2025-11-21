---
toc:
    depth: 2-3
---

# useLogger

Retrieve a logger instance from the `FireflyRuntime` instance. The returned logger will log messages to all registered logger instances.

## Reference

```ts
const logger = useLogger()
```

### Parameters

None

### Returns

A logger instance.

## Usage

```ts !#3,5
import { useLogger } from "@squide/firefly";

const logger = useLogger();

logger.debug("Hello!");
```
