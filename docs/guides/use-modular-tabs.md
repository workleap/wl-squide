---
order: 860
---

# Use modular tabs

While it's typically recommended for a Squide application to maintain the boundary of a page within a single domain, there are situations where **enhancing** the **user experience** necessitates rendering a page with parts from **multiple domains**, or at the very least, simulating it 😊.

For this guide, we'll take as an example a page for which the parts that are owned by different domains are organized by tabs (modular tabs) and registered by different modules:

- `Tab 1`: Registered by `Remote Module 1`
- `Tab 2`: Registered by `Remote Module 2`
- `Tab 3`: Registered by `Local Module`

:::align-image-left
![Anatomy of a page rendering modular tabs](../static/modular-tabs-anatomy.svg)
:::

## Define a nested layout

To build this page while adhering to Squide's constraint of avoiding hard references to elements from other modules, let's start by defining a React Router [nested layout](https://reactrouter.com/en/main/start/tutorial#nested-routes). This nested layout will handle rendering all the tab headers and the content of the active tab:

```tsx !#9-11,15 remote-module-3/src/tabs-layout.tsx
import { Suspense } from "react";
import { Link, Outlet } from "react-router/dom";

export function TabsLayout() {
    return (
        <div>
            <p>Every tab is registered by a different module.</p>
            <ul style={{ listStyleType: "none", margin: 0, padding: 0, display: "flex", gap: "20px" }}>
                <li><Link to="tabs/tab-1">Tab 1</Link></li>
                <li><Link to="tabs/tab-2">Tab 2</Link></li>
                <li><Link to="tabs/tab-3">Tab 3</Link></li>
            </ul>
            <div style={{ padding: "20px" }}>
                <Suspense fallback={<div>Loading...</div>}>
                    <Outlet />
                </Suspense>
            </div>
        </div>
    );
}
```

In the previous code sample, the `TabsLayout` component is similar to the `RootLayout` component introduced in previous guides. However, the key distinction is that this layout will be bound to the `/tabs` URL path. By nesting the layout under a specific path, it will only render when the user navigates to one of the modular tab pages (e.g. `/tabs`, `/tabs/tab-1`, `/tabs/tab-2`, `/tabs/tab-3`).

To register the newly created layout as a nested layout, use the [registerRoute](../reference/runtime/runtime-class.md#register-routes) function:

```tsx !#7-8 remote-module-3/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { TabsLayout } from "./TabsLayout.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Register the layout as a nested layout under the "/tabs" URL path.
        path: "/tabs",
        element: <TabsLayout />
    });

    runtime.registerNavigationItem({
        $id: "tabs",
        $label: "tabs",
        to: "/tabs"
    });
}
```

With this nested layout in place, thanks to the React Router [Outlet](https://reactrouter.com/en/main/components/outlet) component, the content of the tabs can now reside in **distinct routes** (registered by different modules) while still delivering a **cohesive user experience**. Whenever a user navigates between the tabs, the URL will be updated, and the tab content will change, but the shared portion of the layout will remain consistent.

As a bonus, each individual tab will have its own dedicated URL! :partying_face:

!!!info
It is recommended to define the shared layouts in a standalone package as it's done for the [endpoints sample layouts project](https://github.com/gsoft-inc/wl-squide/tree/main/samples/endpoints/layouts).
!!!

## Create the tab routes

Next, let's add the actual tabs to the modules. To do so, we'll use the [parentPath](../reference/runtime/runtime-class.md#register-nested-routes) option of the [registerRoute](../reference/runtime/runtime-class.md#register-routes) function to register the routes under the `TabsLayout` component:

```tsx !#7,10 remote-module-1/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab1 } from "./Tab1.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Using "index: true" instead of a path because this is the default active tab.
        index: true
        element: <Tab1 />
    }, { 
        parentPath: "/tabs"
    });
}
```

```tsx remote-module-1/src/Tab1.tsx
export function Tab1() {
    return (
        <div>Hey, this is Tab 1 content</div>
    );
}
```

```tsx !#8,11 remote-module-2/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab2 } from "./Tab2.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // React Router nested routes requires the first part of the "path" to be the same 
        // as the nested layout path (TabsLayout).
        path: "/tabs/tab-2"
        element: <Tab2 />
    }, { 
        parentPath: "/tabs"
    });
}
```

```tsx remote-module-2/src/Tab2.tsx
export function Tab2() {
    return (
        <div>Hey, this is Tab 2 content</div>
    );
}
```

```tsx !#8,11 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab3 } from "./Tab3.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // React Router nested routes requires the first part of the "path" to be the same 
        // as the nested layout path (TabsLayout).
        path: "/tabs/tab-3"
        element: <Tab3 />
    }, {
        parentPath: "/tabs"
    });
}
```

```tsx local-module/src/Tab3.tsx
export function Tab3() {
    return (
        <div>Hey, this is Tab 3 content</div>
    );
}
```

Now that the tabs has been registered, ensure that all four modules (including `remote-modules-3`) are registered in the host application. Start the development servers using the `dev` script. Navigate to the `/tabs` page, you should see the tab headers. Click on each tab header to confirm that the content renders correctly.

## Decouple the navigation items

Althought it's functional, the modules are currently coupled by hardcoded URLs within the `TabsLayout` component.

To decouple the navigation items, similar to what is done for regular module's routes, we'll use the [registerNavigationItem](../reference/runtime/runtime-class.md#register-navigation-items) function. In this case, we'll specify a [menuId](../reference/runtime/runtime-class.md#register-navigation-items-for-a-specific-menu) option. Defining the `menuId` option will allow the `TabsLayout` component to exclusively retrieve the navigation items that belongs to him.

First, let's register the navigation items with the `menuId` option. For this example the `menuId` will be `/tabs` (it can be anything):

```tsx !#20 remote-module-1/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab1 } from "./Tab1.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Using "index: true" instead of a path because this is the default active tab.
        index: true
        element: <Tab1 />
    }, { 
        parentPath: "/tabs" 
    });

    runtime.registerNavigationItem({
        $id: "tab-1",
        $label: "Tab 1",
        to: "/tabs"
    }, { 
        // The menu id could be anything, in this example we are using the same path as the nested layout
        // path for convenience.
        menuId: "/tabs"
    });
}
```

```tsx !#21 remote-module-2/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab2 } from "./Tab2.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // React Router nested routes requires the first part of the "path" to be the same 
        // as the nested layout path (TabsLayout).
        path: "/tabs/tab-2"
        element: <Tab2 />
    }, { 
        parentPath: "/tabs"
    });

    runtime.registerNavigationItem({
        $id: "tab-2",
        $label: "Tab 2",
        to: "/tabs/tab-2"
    }, { 
        // The menu id could be anything, in this example we are using the same path as the nested layout
        // path for convenience.
        menuId: "/tabs"
    });
}
```

```tsx !#21 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab3 } from "./Tab3.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // React Router nested routes requires the first part of the "path" to be the same 
        // as the nested layout path (TabsLayout).
        path: "/tabs/tab-3"
        element: <Tab3 />
    }, { 
        parentPath: "/tabs"
    });

    runtime.registerNavigationItem({
        $id: "tab-3",
        $label: "Tab 3",
        to: "/tabs/tab-3"
    }, {
        // The menu id could be anything, in this example we are using the same path as the nested layout
        // path for convenience. 
        menuId: "/tabs" 
    });
}
```

Then, update the `TabsLayout` component to render the registered navigation items instead of the hardcoded URLs:

```tsx !#32 remote-module-3/src/tabs-layout.tsx
import { 
    useNavigationItems,
    useRenderedNavigationItems,
    type NavigationLinkRenderProps,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/react-router";
import { Suspense } from "react";
import { Link, Outlet } from "react-router/dom";

const renderItem: RenderItemFunction = (item, key) => {
    const { label, linkProps } = item as NavigationLinkRenderProps;

    return (
        <li key={key}>
            <Link {...linkProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = elements => {
    return (
        <ul style={{ listStyleType: "none", margin: 0, padding: 0, display: "flex", gap: "20px" }}>
            {elements}
        </ul>
    );
};

export function TabsLayout() {
    const navigationItems = useNavigationItems({ menuId: "/tabs" });
    const renderedTabs = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <div>
            <p>Every tab is registered by a different module.</p>
            {renderedTabs}
            <div style={{ padding: "20px" }}>
                <Suspense fallback={<div>Loading...</div>}>
                    <Outlet />
                </Suspense>
            </div>
        </div>
    );
}
```

## Change the display order of the tabs

Similarly to how the display order of regular navigation items can be configured, a modular tab position can be affected with the [priority](http://localhost:5000/wl-squide/reference/runtime/runtime-class/#sort-registered-navigation-items) option.

To force `Tab 3` to be positioned first, we'll give him a priority of `999`: 

```tsx !#16 local-module/src/register.tsx
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Tab3 } from "./Tab3.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/tabs/tab-3"
        element: <Tab3 />
    }, { 
        parentPath: "/tabs"
    });

    runtime.registerNavigationItem({
        $id: "tab-3",
        $label: "Tab 3",
        // Highest priority goes first.
        $priority: 999,
        to: "/tabs/tab-3"
    }, { 
        menuId: "/tabs" 
    });
}
```

## Try it :rocket:

To ensure everything is still working correctly, start the development servers using the `dev` script and navigate to the `/tabs` page. You should see all three tabs, and you should be able to switch between them by clicking on the tab headers.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll find a log entry for each registration that occurs and error messages if something went wrong:
    - `[squide] The following route has been registered as a children of the "/tabs" route.`
    - `[squide] The following static navigation item has been registered to the "/tabs" menu for a total of 1 item.`
- Refer to a working example on [GitHub](https://github.com/gsoft-inc/wl-squide/tree/main/samples/basic).
- Refer to the [troubleshooting](../troubleshooting.md) page.
