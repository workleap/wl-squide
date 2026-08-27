# useNavigationItemsByMenu

Retrieve the full navigation registry grouped by menu id from the `FireflyRuntime` instance.

## Reference

```ts
const itemsByMenu = useNavigationItemsByMenu()
```

### Parameters

None.

### Returns

A `Map<string, RootNavigationItem[]>` keyed by `menuId`. Like [useNavigationItems](./useNavigationItems.md), the arrays are returned as is, in registry insertion order — this hook does not sort by `$priority`.

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
