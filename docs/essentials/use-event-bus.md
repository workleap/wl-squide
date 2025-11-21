---
order: 420
label: Use the event bus
---

# Use the event bus

Squide provides a built-in event bus so that modules and other parts of a modular application can communicate in a loosely coupled way.

For more details, refer to the [useEventBusListener](../reference/messaging/useEventBusListener.md) and [useEventBusDispatcher](../reference/messaging/useEventBusDispatcher.md) reference documentation.

## Add an event listener

```ts
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

## Dispatch an event

```ts
import { useEventBusDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

dispatch("foo", "bar");
```


