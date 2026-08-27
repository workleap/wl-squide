---
order: 55
toc:
    depth: 2-3
---

# useRenderedNavigationItems

Recursively parse a navigation items structure to transform the items into React Elements.

> The [useNavigationItems](../routing/useNavigationItems.md) hook returns the navigation items tree structure as is, meaning the consumer has to recursively parse the structure to transform the items into actual React Elements.
>
> As it's a non-trivial process, Squide provides this utility hook.

## Reference

```ts
const elements = useRenderedNavigationItems(
    navigationItems: [],
    renderItem: (item, key, index, level) => {},
    renderSection: (elements, key, index, level) => {})
```

### Parameters

- `navigationItems`: An array of `RootNavigationItem` to render, an alias of `NavigationLink | NavigationSection`. The hook sorts by `$priority` (higher first) at every depth, and forwards every item's `$priority` to `renderItem` as [priority](#read-an-item-priority).
- `renderItem`: A function to render a link from a navigation item
- `renderSection`: A function to render a section from a collection of items.

#### `NavigationLink`

Accept any properties of a React Router [Link](https://reactrouter.com/en/main/components/link) component with the addition of:

- `$id`: An optional identifier for the link. Usually used as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The link label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the link should be rendered.
- `$priority`: An optional order priority affecting the position of the item among its siblings (higher first), at any depth. Also forwarded to `renderItem` as `priority`, see [Read an item priority](#read-an-item-priority).
- `$additionalProps`: An optional object literal of additional props to spread onto the link component.
- `$context`: An optional object literal of data for the code rendering the menu to read. Never spread onto the link component.

#### `NavigationSection`

- `$id`: An optional identifier the section. Usually used to nest navigation items undern a specific section and as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The section label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the section should be rendered.
- `$priority`: An optional order priority affecting the position of the section among its siblings (higher first), at any depth. Also forwarded to `renderItem` as `priority`, see [Read an item priority](#read-an-item-priority).
- `$additionalProps`: An optional object literal of additional props to spread onto the section component.
- `$context`: An optional object literal of data for the code rendering the menu to read. Never spread onto the section component.
- `children`: The section items.

!!!info
`$additionalProps` and `$context` serve different purposes. `$additionalProps` is spread onto the rendered component, so every key must be a valid prop for that component. `$context` is only handed to the code rendering the menu, which decides what to do with it.

`$context` is per-item data for the layout. It is unrelated to the module registration context a module's `register` function receives, and unrelated to React context.

Reach for `$context` when a value drives *how* an item renders, like a `highlight` flag, and for `$additionalProps` when the component itself understands the prop. Putting a value that isn't a valid prop in `$additionalProps` leaks it onto the DOM element as an invalid attribute.
!!!

### Returns

An array of `ReactElement`.

## Usage

### Render nested items

!!!tip
We recommend always providing an `$id` option for a navigation item, as it ensures the menus doesn't flicker when deferred registrations are updated. Be sure to use a unique key.

When no `$id` option is provided, a default `key` argument is computed based on the `index` and `level` properties. While this works in most cases, the default key cannot guarantee that the menu won't flicker during updates.
!!!

```tsx !#38-40,42-48,52
import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { 
    useNavigationItems, 
    useRenderedNavigationItems, 
    isNavigationLink,
    type RenderItemFunction, 
    type RenderSectionFunction, 
    type NavigationLinkRenderProps, 
    type NavigationSectionRenderProps
} from "@squide/firefly";

type RenderLinkItemFunction = (item: NavigationLinkRenderProps, key: string) => ReactNode;

type RenderSectionItemFunction = (item: NavigationSectionRenderProps, key: string) => ReactNode;

const renderLinkItem: RenderLinkItemFunction = ({ label, linkProps, additionalProps }, key) => {
    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSectionItem: RenderSectionItemFunction = ({ label, section }, key) => {
    return (
        <li key={key}>
            {label}
            <div>
                ({section})
            </div>
        </li>
    );
};

const renderItem: RenderItemFunction = (item, key) => {
    return isNavigationLink(item) ? renderLinkItem(item, key) : renderSectionItem(item, key);
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

export function RootLayout() {
    const navigationItems = useNavigationItems();
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <nav>{navigationElements}</nav>
            <Outlet />
        </>
    );
}
```

### Render additional props

Any properties defined in the `$additionalProps` option are spread onto the component rendering the item:

```tsx !#7-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        $additionalProps: {
            "data-tracking-id": "about-link"
        },
        to: "/about"
    });
};
```

```tsx !#2,6
const renderLinkItem: RenderLinkItemFunction = (item, key) => {
    const { label, linkProps, additionalProps } = item;

    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};
```

Every key is spread, therefore every key must be a valid prop for the component being rendered. For values that the rendering code should read rather than forward, use [$context](#read-an-item-context) instead.

### Read an item context

Any value defined in the `$context` option is handed to the rendering code as `context`, and is never spread onto the rendered component:

```tsx !#7-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        $context: {
            highlight: true
        },
        to: "/about"
    });
};
```

```tsx !#2,5
const renderLinkItem: RenderLinkItemFunction = (item, key) => {
    const { label, linkProps, additionalProps, context } = item;

    return (
        <li key={key} style={{ fontWeight: context.highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};
```

`context` defaults to an empty object, so it can be destructured without a guard.

### Read an item priority

This hook orders items by `$priority` at every depth, so nothing is required of the rendering code to get a sorted menu. The value is handed to it as `priority` anyway, for the things ordering does not cover — grouping, badging, or a comparator of its own:

```tsx !#8-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "management",
        $label: "Management",
        children: [
            { $id: "users", $label: "Users", $priority: 10, to: "/users" },
            { $id: "teams", $label: "Teams", $priority: 5, to: "/teams" }
        ]
    });
};
```

```tsx !#2,5
const renderLinkItem: RenderLinkItemFunction = (item, key) => {
    const { label, linkProps, additionalProps, priority } = item;

    return (
        <li key={key} data-priority={priority}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};
```

!!!warning
`priority` is forwarded exactly as it was declared, `undefined` included, so an unset priority can be told apart from an explicit `0`. A comparator here cannot reorder the menu — this hook has already ordered it, and neither callback is handed an array of items to sort. It is for the layout's own grouping or badging, over an array the layout built itself.

Default a missing priority the way this hook does:

```ts
// Wrong. TypeScript rejects the subtraction, since "priority" is optional (TS18048).
(x: NavigationLinkRenderProps, y: NavigationLinkRenderProps) => y.priority - x.priority;

// Right, matching this hook's own default.
(x: NavigationLinkRenderProps, y: NavigationLinkRenderProps) => (y.priority ?? 0) - (x.priority ?? 0);
```

Bypass the type error and the failure is worse than an exception: a comparator returning `NaN` is read as "these two are equal", so it becomes inconsistent and the items come back in an arbitrary order — partially sorted, not left alone.
!!!

Neither render callback is a place to reorder items: `renderItem` renders a single item and cannot see its siblings, and `renderSection` receives elements that have already been rendered.

Pre-sorting the array before handing it over does not work either, since this hook sorts every array it receives and only ties keep the order they arrived in. An order that contradicts `$priority` can only be had by passing in a tree that carries no `$priority`, or by not using this hook.

!!!warning
Build a new tree for that. [useNavigationItems](./useNavigationItems.md) returns the registry's own objects, and a section's `children` is the registry's own array, so deleting `$priority` from what it hands you strips it for every other consumer of the registry and every other menu rendering those items. A shallow `{ ...item }` copy is not enough either, since `children` is still shared by reference and only the top level ends up stripped.
!!!

```tsx
import type { NavigationItem } from "@squide/firefly";

// The return type annotation is required: without it, this recursive helper reports TS7023.
function withoutPriority(items: NavigationItem[]): NavigationItem[] {
    return items.map(({ $priority, ...rest }) => (
        "children" in rest && rest.children
            ? { ...rest, children: withoutPriority(rest.children) }
            : rest
    ) as NavigationItem);
}
```

### Render dynamic segments

The `to` option of a navigation item can include dynamic segments (`/user-profile/:userId`), enabling the rendering of dynamic routes based on contextual values. To resolve a route dynamic segments, use the [resolveRouteSegments](resolveRouteSegments.md) function.

```tsx !#14,18,21,39-45,56,59
import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { 
    useNavigationItems, 
    useRenderedNavigationItems,
    isNavigationLink,
    resolveRouteSegments
    type RenderItemFunction, 
    type RenderSectionFunction, 
    type NavigationLinkRenderProps, 
    type NavigationSectionRenderProps
} from "@squide/firefly";

type RenderLinkItemFunction = (item: NavigationLinkRenderProps, key: string, userId: string) => ReactNode;

type RenderSectionItemFunction = (item: NavigationSectionRenderProps, key: string) => ReactNode;

const renderLinkItem: RenderLinkItemFunction = ({ label, { to, ...linkProps}, additionalProps }, key, userId) => {
    return (
        <li key={key}>
            <Link to={resolveRouteSegments(to as string, { userId })} {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSectionItem: RenderSectionItemFunction = ({ label, section }, key) => {
    return (
        <li key={key}>
            {label}
            <div>
                ({section})
            </div>
        </li>
    );
};

function renderItem(userId: string) {
    const fct: RenderItemFunction = (item, key) => {
        return isNavigationLink(item) ? renderLinkItem(item, key, userId) : renderSectionItem(item, key);
    };

    return fct;
}

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

export function UserProfileLayout() {
    const { userId } = useParams();

    const navigationItems = useNavigationItems({ menuId: "/user-profile" });
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem(userId), renderSection);

    return (
        <>
            <nav>{navigationElements}</nav>
            <Outlet />
        </>
    );
}
```

```tsx !#7
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "user-profile",
        $label: "User profile",
        to: "/user-profile/:userId"
    }, {
        menuId: "/user-profile"
    });
}
```


