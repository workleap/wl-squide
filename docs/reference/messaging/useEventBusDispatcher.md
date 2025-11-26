---
toc:
    depth: 2-3
---

# useEventBusDispatcher

Use the `FireflyRuntime` instance event bus to dispatch an event.

## Reference

```ts
const dispatch = useEventBusDispatcher()
```

### Parameters

None

### Returns

A dispatch function: `(eventName: string, payload?: {}) => void`.

## Usage

```ts !#3,5
import { useEventBusDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

dispatch("foo", "bar");
```
