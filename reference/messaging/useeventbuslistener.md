# useEventBusListener

Attach a listener to the `FireflyRuntime` instance event bus.

## Reference

```ts
useEventBusListener(eventName, callback: () => {}, options?: { once? })
```

### Parameters

- `eventName`: The name of the event to listen for. Must be a key augmented in [EventMap](./EventMap.md).
- `callback`: A function to be executed when an event matching the provided name is dispatched.
- `options`: An optional object literal of options:
    - `once`: Whether or not the event listener should be automatically removed once an event has been handled.

### Returns

Nothing

## Usage

```ts !#8
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleToast = useCallback(data => {
    console.log("Toast:", data);
}, []);

useEventBusListener("show-toast", handleToast);
```

### Listen once

```ts !#8
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleToast = useCallback(data => {
    console.log("Toast:", data);
}, []);

useEventBusListener("show-toast", handleToast, { once: true });
```
