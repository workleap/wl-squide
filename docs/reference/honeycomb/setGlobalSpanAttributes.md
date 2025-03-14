---
toc:
    depth: 2-3
---

# setGlobalSpanAttributes

Set global attributes to be included in all Honeycomb Web traces.

!!!info
This function serves as a wrapper around the [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) library. Before using it, read the documentation for the [setGlobalSpanAttributes](https://workleap.github.io/wl-honeycomb-web/reference/setglobalspanattributes/) function provided by `@workleap/honeycomb`.
!!!

## Reference

```ts
setGlobalSpanAttributes(attributes: {})
```

### Parameters

- `attributes`: The attributes to include in every trace.

### Returns

Nothing

## Usage

```ts
import { setGlobalSpanAttributes } from "@squide/firefly-honeycomb";

setGlobalSpanAttributes({
    "app.user_id": "123"
});
```
