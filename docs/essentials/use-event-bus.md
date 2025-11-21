---
order: 420
label: Use the event bus
---

# Use the event bus

Squide provides a built-in event bus so that modules and other parts of a modular application can communicate in a loosely coupled way.

For more details, refer to the [useEventBusListener](../reference/messaging/useEventBusListener.md) and [useEventBusDispatcher](../reference/messaging/useEventBusDispatcher.md) reference documentation.

## Add an event listener

Register a function that will be invoked each time the specified event is dispatched:

```ts !#9
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleFoo = useCallback((data, context) => {
    // Do something...
}, []);

// Listen to every "foo" events.
useEventBusListener("foo", handleFoo);
```

## Add an event listener that will be invoked once

Register a function that will be invoked and will then automatically unregisters itself right after it's execution:

```ts !#9
import { useCallback } from "react";
import { useEventBusListener } from "@squide/firefly";

const handleFoo = useCallback((data, context) => {
    // Do something...
}, []);

// Listen to the first "foo" event.
useEventBusListener("foo", handleFoo, { once: true };
```

## Dispatch an event

```ts !#3,6
import { useEventBusDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

// Dispatch a "foo" event with a "bar" payload.
dispatch("foo", "bar");
```


