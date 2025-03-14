---
order: -100
toc:
    depth: 2-3
---

# useIsRouteProtected

Determine whether or not a route is considered as `protected`.

> To take advantage of this hook, make sure to add a [$visibility](../runtime/runtime-class.md#register-a-public-route) hint to your public pages.

## Reference

```ts
const isProtected = useIsRouteProtected(route)
```

### Parameters

- `route`: A `Route` object.

### Returns

A `boolean` value indicating whether or not the matching route is `protected`.

## Usage

```ts
import { useLocation } from "react-router/dom";
import { useIsRouteProtected, useRouteMatch } from "@squide/firefly";

const location = useLocation();
const route = useRouteMatch(location);

const isActiveRouteProtected = useIsRouteProtected(route);
```
