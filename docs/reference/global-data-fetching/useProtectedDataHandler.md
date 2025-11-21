---
order: 60
toc:
    depth: 2-3
---

# useProtectedDataHandler

Execute the specified handler once the modules are ready, the **active route** is **protected** and, when applicable, [Mock Service Worker](https://mswjs.io/) is also ready.

## Reference

```ts
useProtectedDataHandler(handler)
```

### Parameters

- `handler`: A `void` function.

### Returns

Nothing

## Usage

```ts !#3-5
import { useProtectedDataHandler } from "@squide/firefly";

useProtectedDataHandler(() => {
    console.log("The modules are ready and the active route is protected!");
});
```
