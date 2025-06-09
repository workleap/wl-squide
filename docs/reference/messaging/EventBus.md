---
toc:
    depth: 2-3
---

# EventBus

A basic implementation of a [pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) mechanism enabling loosely coupled between the host application and the modules.

## Reference

```ts
const eventBus = new EventBus(options?: { logger? })
```

### Parameters

- `options`: An optional object literal of options:
    - `logger`: An optional logger to facilitate debugging.

### Methods

- `addListener(eventName, callback, options?)`: Register the `callback` event listener for `eventName`.
- `removeListener(eventName, callback, options?)`: Remove the `callback` event listener for `eventName`.
- `dispatch(eventName, payload?)`: Dispatch an event to the listeners of `eventName`. 

## Usage

### Create an event bus instance

```ts
import { EventBus, RuntimeLogger } from "@squide/firefly";

const eventBus = new EventBus({
    logger: new RuntimeLogger([])
});
```

### Add a listener

!!!tip
When possible, prefer [useEventBusListener](useEventBusListener.md) to `eventBus.addListener`.
!!!

```ts
import { useCallback } from "react";

const handleFoo = useCallback((data, context) => {
    // do something...
}, [];

// Listen to every "foo" events.
eventBus.addListener("foo", handleFoo);

// Listen to the first "foo" event, then automatically remove the listener.
eventBus.addListener("foo-once", handleFoo, { once: true });
```

### Remove a listener

```ts
// Remove a regular listener.
eventBus.removeListener("foo", handleFoo);

// Remove a listener created with the `once` option.
eventBus.removeListener("foo-once", handleFoo, { once: true });
```

### Dispatch an event

!!!tip
When possible, prefer [useEventBusDispatcher](useEventBusListener.md) to `eventBus.dispatch`.
!!!

```ts
eventBus.dispatch("foo", "bar");
```

