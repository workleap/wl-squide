---
toc:
    depth: 2-3
---

# EventBus

A basic implementation of a [pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) mechanism enabling loosely coupled between the host application and the modules.

## Reference

```ts
const eventBus = new EventBus(logger)
```

### Parameters

- `logger`: A logger instance.

### Methods

- `addListener(eventName, callback, options?)`: Register the `callback` event listener for `eventName`.
- `removeListener(eventName, callback, options?)`: Remove the `callback` event listener for `eventName`.
- `dispatch(eventName, payload?)`: Dispatch an event to the listeners of `eventName`. 

## Usage

### Create an event bus instance

```ts !#4-6
import { EventBus } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";

const eventBus = new EventBus({
    logger: new BrowserConsoleLogger([])
});
```

### Add a listener

!!!tip
When possible, prefer [useEventBusListener](useEventBusListener.md) to `eventBus.addListener`.
!!!

```ts !#8,11
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

```ts !#2,5
// Remove a regular listener.
eventBus.removeListener("foo", handleFoo);

// Remove a listener created with the `once` option.
eventBus.removeListener("foo-once", handleFoo, { once: true });
```

### Dispatch an event

!!!tip
When possible, prefer [useEventBusDispatcher](useEventBusListener.md) to `eventBus.dispatch`.
!!!

```ts !#1
eventBus.dispatch("foo", "bar");
```

