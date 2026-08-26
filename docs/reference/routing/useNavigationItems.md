---
order: 50
toc:
    depth: 2-3
---

# useNavigationItems

Retrieve the registered navigation items from the `FireflyRuntime` instance.

## Reference

```ts
const navigationItems = useNavigationItems(options?: { menuId? })
```

### Parameters

- `options`: An optional object literal of options:
    - `menuId`: An optional id to retrieve the navigation menu for a specific menu.

### Returns

An array of `NavigationLink | NavigationSection`. The items are returned as is, in registry insertion order: this hook does not sort. Use [useRenderedNavigationItems](./useRenderedNavigationItems.md) to get the top-level items sorted by `$priority`.

#### `NavigationLink`

Accept any properties of a React Router [Link](https://reactrouter.com/en/main/components/link) component with the addition of:
- `$id`: An optional identifier for the link. Usually used as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The link label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the link should be rendered.
- `$additionalProps`: An optional object literal of additional props to spread onto the link component.
- `$meta`: An optional object literal of metadata for the code rendering the menu to read. Never spread onto the link component.

#### `NavigationSection`

- `$id`: An optional identifier for the section. Usually used to nest navigation items under a specific section and as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The section label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the section should be rendered.
- `$additionalProps`: An optional object literal of additional props to spread onto the section component.
- `$meta`: An optional object literal of metadata for the code rendering the menu to read. Never spread onto the section component.
- `children`: The section items.

## Usage

### Retrieve the items for the root menu

```ts !#3
import { useNavigationItems } from "@squide/firefly";

const items = useNavigationItems();
```

### Retrieve the items for a specific menu

```ts !#3
import { useNavigationItems } from "@squide/firefly";

const items = useNavigationItems({ menuId: "my-custom-menu" });
```
