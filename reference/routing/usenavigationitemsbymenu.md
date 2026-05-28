# useNavigationItemsByMenu

Retrieve the full navigation registry grouped by menu id from the `FireflyRuntime` instance.

## Reference

```ts
const itemsByMenu = useNavigationItemsByMenu()
```

### Parameters

None.

### Returns

A `Map<string, Array<NavigationLink | NavigationSection>>` keyed by `menuId`.

## Usage

### Read every registered navigation item

```ts !#3
import { useNavigationItemsByMenu } from "@squide/firefly";

const itemsByMenu = useNavigationItemsByMenu();
```

### Discover the registered menu ids

```ts !#3-4
import { useNavigationItemsByMenu } from "@squide/firefly";

const itemsByMenu = useNavigationItemsByMenu();
const menuIds = Array.from(itemsByMenu.keys());
```
