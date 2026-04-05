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

A dispatch function. The event name must be a key augmented in [EventMap](./EventMap.md). The payload type is inferred from the event name.

## Usage

```ts !#3,5
import { useEventBusDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

dispatch("show-toast", "Hello!");
```
