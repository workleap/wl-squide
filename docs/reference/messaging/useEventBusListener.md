---
toc:
    depth: 2-3
---

# useEventBusListener

Attach a listener to the `FireflyRuntime` instance event bus.

## Reference

```ts
useEventBusListener(eventName, callback: () => {}, options?: { once? })
```

### Parameters

- `eventName`: The name of the event to listen for.
- `callback`: A function to be executed when a event matching the provided name is dispatched.
- `options`: An optional object literal of options:
    - `once`: Whether or not the event listener should be automatically removed once an event as been handled.

### Returns

Nothing

## Usage

```ts !#9,12
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleFoo = useCallback((data, context) => {
    // Do something...
}, []);

// Listen to every "foo" events.
useEventBusListener("foo", handleFoo);

// Listen to the first "foo" event, then automatically remove the listener.
useEventBusListener("foo", handleFoo, { once: true };
```
