---
order: 60
toc:
    depth: 2-3
---

# resolveRouteSegments

Replace a route segments (paths starting with `:`) with the provided values. For a value to be applied to a segment, the value `key` must match the segment minus the `:`.

## Reference

```ts
const resolvedRoute = resolveRouteSegments("/page/:arg1", { arg1: "value-1" })
```

### Parameters

- `to`: A route with segments.
- `values`: An object literal of segment values.

### Returns

The resolved route.

## Usage

```ts !#6
import { resolveRouteSegments, type NavigationLinkRenderProps } from "@squide/firefly";

function renderLinkItem({ label, linkProps: { to, ...linkProps } }: NavigationLinkRenderProps, index: number, level: number) {
    return (
        <li key={`${level}-${index}`}>
            <Link to={resolveRouteSegments(to as string, { arg1: "value-1" })} {...linkProps}>
                {label}
            </Link>
        </li>
    );
}
```
