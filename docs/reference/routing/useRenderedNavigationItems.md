---
order: 80
toc:
    depth: 2-3
---

# useRenderedNavigationItems

Recursively parse a navigation items structure to transform the items into React Elements.

> The [useNavigationItems](../runtime/useNavigationItems.md) hook returns the navigation items tree structure as is, meaning the consumer has to recursively parse the structure to transform the items into actual React Elements.
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

- `navigationItems`: An array of `NavigationLink | NavigationSection` to render.
- `renderItem`: A function to render a link from a navigation item
- `renderSection`: A function to render a section from a collection of items.

#### `NavigationLink`

Accept any properties of a React Router [Link](https://reactrouter.com/en/main/components/link) component with the addition of:

- `$id`: An optional identifier for the link. Usually used as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The link label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the link should be rendered.
- `$additionalProps`: An optional object literal of additional props to apply to the link component.

#### `NavigationSection`

- `$id`: An optional identifier the section. Usually used to nest navigation items undern a specific section and as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The section label. Could either by a `string` or a `ReactNode`.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the section should be rendered.
- `$additionalProps`: An optional object literal of additional props to apply to the section component.
- `children`: The section items.

### Returns

An array of `ReactElement`.

## Usage

### Render nested items

!!!info
We recommend always providing an `$id` option for a navigation item, as it ensures the menus doesn't flicker when [deferred registrations](../registration/registerLocalModules.md#defer-the-registration-of-navigation-items) are updated. Be sure to use a unique key.

When no `$id` option is provided, a default `key` argument is computed based on the `index` and `level` properties. While this works in most cases, the default key cannot guarantee that the menu won't flicker during updates.
!!!

```tsx !#38-40,42-48,52 host/src/RootLayout.tsx
import type { ReactNode } from "react";
import { Link, Outlet } from "react-router/dom";
import { 
    useNavigationItems, 
    useRenderedNavigationItems, 
    isNavigationLink,
    type RenderItemFunction, 
    type RenderSectionFunction, 
    type NavigationLinkRenderProps, 
    type NavigationSectionRenderProps
} from "@squide/react-router";

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

### Render dynamic segments

The `to` option of a navigation item can include dynamic segments (`/user-profile/:userId`), enabling the rendering of dynamic routes based on contextual values. To resolve a route dynamic segments, use the [resolveRouteSegments](resolveRouteSegments.md) function.

```tsx !#14,18,21,39-45,56,59 host/src/UserProfileLayout.tsx
import type { ReactNode } from "react";
import { Link, Outlet } from "react-router/dom";
import { 
    useNavigationItems, 
    useRenderedNavigationItems,
    isNavigationLink,
    resolveRouteSegments
    type RenderItemFunction, 
    type RenderSectionFunction, 
    type NavigationLinkRenderProps, 
    type NavigationSectionRenderProps
} from "@squide/react-router";

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

```tsx !#7 remote-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = (runtime) => {
    runtime.registerNavigationItem({
        $id: "user-profile",
        $label: "User profile",
        to: "/user-profile/:userId"
    }, {
        menuId: "/user-profile"
    });
}
```


