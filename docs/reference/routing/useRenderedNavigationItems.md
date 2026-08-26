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

- `navigationItems`: An array of `RootNavigationItem` to render — a `NavigationLink | NavigationSection` plus an optional `$priority`. The hook sorts the **top-level** items of the array by `$priority` (higher first) before rendering. Nested items render in the order they appear in their section's `children` array, their `$priority` is ignored.
    - `$priority`: An optional order priority affecting the position of the item in the menu (higher first). Declared on `RootNavigationItem` only. It is honored for the menu's top-level items. A nested item may still carry a `$priority` at runtime, when it was registered with the `sectionId` option, but it is ignored.
- `renderItem`: A function to render a link from a navigation item
- `renderSection`: A function to render a section from a collection of items.

#### `NavigationLink`

Accept any properties of a React Router [Link](https://reactrouter.com/en/main/components/link) component with the addition of:

- `$id`: An optional identifier for the link. Usually used as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The link label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the link should be rendered.
- `$additionalProps`: An optional object literal of additional props to spread onto the link component.
- `$meta`: An optional object literal of metadata for the code rendering the menu to read. Never spread onto the link component.

#### `NavigationSection`

- `$id`: An optional identifier the section. Usually used to nest navigation items undern a specific section and as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The section label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the section should be rendered.
- `$additionalProps`: An optional object literal of additional props to spread onto the section component.
- `$meta`: An optional object literal of metadata for the code rendering the menu to read. Never spread onto the section component.
- `children`: The section items.

!!!info
`$additionalProps` and `$meta` serve different purposes. `$additionalProps` is spread onto the rendered component, so every key must be a valid prop for that component. `$meta` is only handed to the code rendering the menu, which decides what to do with it.

Reach for `$meta` when a value drives *how* an item renders, like a `highlight` flag, and for `$additionalProps` when the component itself understands the prop. Putting a value that isn't a valid prop in `$additionalProps` leaks it onto the DOM element as an invalid attribute.
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

Every key is spread, therefore every key must be a valid prop for the component being rendered. For values that the rendering code should read rather than forward, use [$meta](#read-item-metadata) instead.

### Read item metadata

Any value defined in the `$meta` option is handed to the rendering code as `meta`, and is never spread onto the rendered component:

```tsx !#7-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        $meta: {
            highlight: true
        },
        to: "/about"
    });
};
```

```tsx !#2,5
const renderLinkItem: RenderLinkItemFunction = (item, key) => {
    const { label, linkProps, additionalProps, meta } = item;

    return (
        <li key={key} style={{ fontWeight: meta.highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};
```

`meta` defaults to an empty object, so it can be destructured without a guard.

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


