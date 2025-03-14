---
order: 70
toc:
    depth: 2-3
---

# useRouteMatch

Execute [React Router's matching algorithm](https://reactrouter.com/en/main/utils/match-routes) against Squide's routes registry and a given `location` to determine if any route match the location.

## Reference

```ts
const match = useRouteMatch(locationArg, options?: { throwWhenThereIsNoMatch? })
```

### Parameters

- `locationArg`: The location to match the route paths against.
- `options`: An optional object literal of options:
    - `throwWhenThereIsNoMatch`: Whether or not to throw an `Error` if no route match `locationArg`.

### Returns

A `Route` object if there's a matching route, otherwise if `throwWhenThereIsNoMatch` is enabled and no route match the given location, an `Error` is thrown.

If `throwWhenThereIsNoMatch` is disabled and there's no route matching `locationArg`, `undefined` is returned.

## Usage

### Using `useLocation`

```ts
import { useLocation } from "react-router/dom";
import { useRouteMatch } from "@squide/firefly";

const location = useLocation();

const activeRoute = useRouteMatch(location);
```

### Using `window.location`

```ts
import { useRouteMatch } from "@squide/firefly";

const activeRoute = useRouteMatch(window.location);
```
