---
order: 490
label: Register navigation items
toc:
    depth: 2-3
---

# Register navigation items

Navigation items are the second pillar of the Squide modular experience. By allowing consumers to register dynamic navigation items, Squide enables developers to build scalable modular applications with well-defined boundaries.

Below are the most common use cases. For more details, refer to the [reference](../reference/runtime/FireflyRuntime.md) documentation.

## Register a basic item

Typically, simple navigation items using only the `$id`, `$label` and `to` options will be defined:

```ts !#4-8
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "page-1",
        $label: "Page 1",
        to: "/page-1"
    });
};
```

!!!tip
We recommend always providing an `$id` option for a navigation item, as it ensures the menus doesn't flicker when [deferred registrations](./register-deferred-nav-items.md) are updated. Be sure to use a unique identifier.
!!!

!!!tip
The `registerNavigationItem` function accepts a `sectionId` option, allowing a navigation item to be nested under an existing navigation section. When searching the parent navigation section matching the `sectionId` option, the `sectionId` will be match against the `$id` option of every navigation item.
!!!

## Register a nested item

Similarly to [nested routes](./register-routes.md#register-a-nested-route), a navigation item can be nested under an existing section be specifying a `sectionId` option that matches the section's `$id` option:

```ts !#10
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "link",
        $label: "Link",
        to: "/link"
    }, {
        // The following example takes for granted that a section with the "some-section" $id is already registered or will be registered.
        sectionId: "some-section"
    });
};
```

Navigation items can also be nested by registering multipe items in a single registration block:

```ts !#10-31
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    // Register the following menu hierarchy:
    //
    //  Section
    //  --- Nested Section
    //  ------- Nested Nested Link
    //  --- Nested Link
    runtime.registerNavigationItem({
        $id: "section",
        $label: "Section",
        children: [
            {
                $id: "nested-section",
                $label: "Nested Section",
                children: [
                    {
                        $id: "nested-nested-link",
                        $label: "Nested Nested Link",
                        to: "#"
                    }
                ]
            },
            {
                $id: "nested-link",
                $label: "Nested Link",
                to: "#"
            }
        ]
    });
};
```

## Register an item with a sorting priority

A `$priority` option can be defined for a navigation item to affect it's position in the menu. The sorting algorithm is as follow:

- By default a navigation item have a priority of `0`.
- If no navigation item have a priority, the items are positioned according to their registration order.
- If an item have a priority `> 0`, the item will be positioned before any other items with a lower priority (or without an explicit priority value).
- If an item have a priority `< 0`, the item will be positioned after any other items with a higher priority (or without an explicit priority value).

```ts !#7,16
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        $priority: 10,
        to: "/about"
    });

    runtime.registerNavigationItem({
        $id: "home",
        $label: "Home",
        // Because the "Home" navigation item has an higher priority, it will be rendered
        // before the "About" navigation item.
        $priority: 100,
        to: "/home"
    });
};
```

## Use dynamic segments for an item link

Sometimes a route's path depends on dynamic contextual values. To support those routes, navigation items can be defined with [dynamic segments](../reference/routing/useRenderedNavigationItems.md#render-dynamic-segments):

```ts !#7
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "user-profile",
        $label: "User profile",
        to: "/user-profile/:userId"
    });
};
```

## Use a React element in an item label

Navigation item labels are not limited to plain text. For greater flexibility, a label can contain any React component:

```tsx !#7-10
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { QuestionMarkIcon } from "@sample/icons";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: (
            <QuestionMarkIcon />
            <span>About</span>
        ),
        to: "/about"
    });
};
```

## Style an item

Sometimes a module knows best how its navigation items should be styled. To enforce a specific style on a navigation item, define the `style` option:

```ts !#7-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        style: {
            backgroundColor: "#000"
        },
        to: "/about"
    });
};
```

## Open an item link in a new tab

To open a navigation item in a new tab, set the `target` option to `_blank`:

```ts !#7
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        target: "_blank",
        to: "/about"
    });
};
```

## Conditionally render an item

The `$canRender` native property can be used to indicate whether a navigation item should be rendered by the layout:

```ts !#7-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        $canRender: (index: number) => {
            return index % 2 == 0;
        },
        to: "/about"
    });
};
```

It's the responsibility of the code rendering the menu to execute the navigation items `$canRender` function and conditionally render the items based on the return value.

==- Layout code example
```tsx !#12-14
import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key) => {
    if (!item.canRender()) {    
        return null;
    }

    if (!isNavigationLink(item)) {
        return null;
    }

    const { label, linkProps, additionalProps } = item;

    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

export function RootLayout() {
    // Retrieve the navigation items registered by the modules.
    const navigationItems = useNavigationItems();

    // Transform the navigation items into React elements.
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <nav>{navigationElements}</nav>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}
```
===

## Render additional props on an item

Any properties defined in the `$additionalProps` option will be forwarded to the layout:

```ts !#7-9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "about",
        $label: "About",
        $additionalProps: {
            highlight: true
        },
        to: "/about"
    });
};
```

It's the responsibility of the code rendering the menu to handle the additional properties.

==- Layout code example
```tsx !#20,23
import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key) => {
    if (!item.canRender()) {    
        return null;
    }

    if (!isNavigationLink(item)) {
        return null;
    }

    const { label, linkProps, additionalProps: { highlight, ...additionalProps } } = item;

    return (
        <li key={key} style={{ fontWeight: highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

export function RootLayout() {
    // Retrieve the navigation items registered by the modules.
    const navigationItems = useNavigationItems();

    // Transform the navigation items into React elements.
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <nav>{navigationElements}</nav>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}
```
===

## Navigation menu

By default, every navigation item registered through `registerNavigationItem` is added to the `root` navigation menu. The navigation items API also supports defining additional menus.

### Define a menu

To define an additional menu in a layout or page, retrieve the navigation items associated with that menu by passing the menu's identifier to the [useNavigationItems](../reference/runtime/useNavigationItems.md) hook using the `menuId` option:

```tsx !#3
import { useNavigationItems } from "@squide/firefly";

const items = useNavigationItems({ menuId: "page-menu" });
```

Then, render the additional menu items using the [useRenderedNavigationItems](../reference/routing/useRenderedNavigationItems.md) hook:

```tsx !#36,39
import { Link, Outlet } from "react-router";
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key) => {
    if (!isNavigationLink(item)) {
        return null;
    }

    const { label, linkProps, additionalProps } = item;

    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key}>
            {elements}
        </ul>
    );
};

export function Page() {
    // Retrieve the navigation items for the additional menu.
    const navigationItems = useNavigationItems({ menuId: "page-menu" });

    // Transform the navigation items into React elements.
    const navigationElements = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <h2>Page</h2>
        {navigationElements}
    );
}
```

### Register an item in a menu

Finally, register navigation items specifically for this additional menu using the `menuId` option when registering the items:

```tsx !#9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "page-1",
        $label: "Page 1",
        to: "/layout/page-1"
    }, { 
        menuId: "page-menu" 
    });
};
```

## i18next

!!!warning
This section assumes that your application is already [set up with i18next](../guides/setup-i18next.md).
!!!

### Localize the label of an item

A navigation item can be localized by combining the `$label` option with the [I18nextNavigationItemLabel](../reference/i18next/I18nextNavigationItemLabel.md) component:

```tsx !#8
import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";
import { I18nextNavigationItemLabel, useI18nextInstance } from "@squide/i18next";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextInstance = useI18nextInstance("my-app");

    runtime.registerNavigationItem({
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="aboutPage"  />
        to: "/about"
    });
};
```
