---
order: 100
toc:
    depth: 2-3
---

# usePublicDataHandler

Execute the specified handler once the modules are ready and, when applicable, [Mock Service Worker](https://mswjs.io/) is also ready.

## Reference

```ts
usePublicDataHandler(handler)
```

### Parameters

- `handler`: A `void` function.

### Returns

Nothing

## Usage

```ts !#3-5
import { usePublicDataHandler } from "@squide/firefly";

usePublicDataHandler(() => {
    console.log("The modules are ready!");
});
```
