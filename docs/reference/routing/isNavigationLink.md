---
order: -200
toc:
    depth: 2-3
---

# isNavigationLink

Indicate whether or not a navigation item is a `NavigationLink`. This utility is particularly handy when rendering a menu [with nested items](../runtime/FireflyRuntime.md#register-nested-navigation-items).

## Reference

```ts
const isLink = isNavigationLink(item)
```

### Parameters

- `item`: A navigation item rendering props.

### Returns

A `boolean` value indicating whether or not the navigation item should be rendered as a link.

## Usage

```ts !#4
import { isNavigationLink, type RenderItemFunction } from "@squide/firefly";

const renderItem: RenderItemFunction = item => {
    return isNavigationLink(item) ? renderLinkItem(item) : renderSectionItem(item);
};
```
