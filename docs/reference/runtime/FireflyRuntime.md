---
order: 100
toc:
    depth: 2-3
---

# FireflyRuntime

!!!warning
Don't instanciate your own instance of `FireflyRuntime`, use the [initializeFirefly](../registration/initializeFirefly.md) function instead.
!!!

A runtime instance give modules access to functionalities such as routing, navigation, request handlers and logging.

## Reference

```ts
const runtime = new FireflyRuntime(options?: { mode?, useMsw?, loggers?, plugins? })
```

### Parameters

- `options`: An optional object literal of options:
    - `mode`: An optional mode to optimize Squide for production. Values are `"development"` (default) and `"production"`.
    - `loggers`: An optional array of `Logger` instances.
    - `plugins`: An optional array of `Plugin` factory functions.

### Methods

- `registerRoute(route, options?)`: Register a route.
- `registerNavigationItem(navigationItem, options?)`: Register a navigation item.
- `getNavigationItems(menuId?)`: Retrieve the registered navigation items.
- `registerRequestHandlers(handlers)`: Register the MSW request handlers.
- `getPlugin(name)`: Retrieve the registered plugin by the specified `name`.

### Getters

- `mode`: Retrieve the runtime mode.
- `routes`: Retrieve the registered routes.
- `requestHandlers`: Retrieve the registered MSW request handlers.
- `plugins`: Retrieve the registered plugins.
- `logger`: Retrieve the runtime logger.
- `eventBus`: Retrieve the runtime event bus.
- `isMswEnabled`: Indicate whether or not MSW is enabled.

## Usage

### Create a runtime instance

```ts !#3
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime();
```

### Change the runtime mode

```ts !#4
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    mode: "production"
});
```

### Register routes

```ts
runtime.registerRoute(route, options?: { hoist?, parentPath?, parentId? })
```

- `route`: accept any properties of a React Router [Route](https://reactrouter.com/en/main/components/route) component with the addition of:
    - `$id`: An optional identifier for the route. Usually used to nest routes under a specific route.
    - `$visibility`: An optional visibility indicator for the route. Accepted values are `"public"` or `"protected"`.
- `options`: An optional object literal of options:
    - `hoist`: An optional `boolean` value to register the route at the root of the router. The default value is `false`.
    - `parentPath`: An optional path of a parent route to register this new route under.
    - `parentId`: An optional id of a parent route to register this new route under.

```tsx !#4-7
import { Page } from "./Page.tsx"

// Register a new route from a module.
runtime.registerRoute({
    path: "/page-1",
    element: <Page />
});
```

### Register an hoisted route

Unlike a regular route, a hoisted route is added at the root of the router, outside of the host application's root layout, root error boundary and even root authentication boundary. This means that a hoisted route has full control over its rendering. To mark a route as hoisted, provide an `hoist` option to the route options.

```tsx !#7
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/page-1",
    element: <Page />
}, {
    hoist: true
});
```

!!!warning
By declaring a route as hoisted, other parts of the application will not be isolated anymore from this route's failures and the route will not be protected anymore by the application authenticated boundary.

- To **avoid breaking** the entire **application** when an hoisted route encounters unhandled errors, it is highly recommended to declare a React Router's [errorElement](https://reactrouter.com/en/main/route/error-element) property for each hoisted route.
- If the hoisted route requires an authentication, make sure to **wrap** the route **with** an **authentication boundary** or to handle the authentication within the route.
!!!

### Register a public route

When registering a route, a value can be provided indicating whether the route is `"public"` or `"protected"`. This is especially useful when dealing with code that **fetches global data for protected routes** (e.g. a session). Although a route definition accepts a `$visibility` value, we recommended using the runtime `registerPublicRoute` function to register a **root** public route instead.

```tsx !#3-6
import { Page } from "./Page.tsx";

runtime.registerPublicRoute({
    path: "/page-1",
    element: <Page />
});
```

To define a nested route as public, use the `$visibility` option:

```tsx !#9
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

runtime.registerPublicRoute({
    path: "/layout",
    element: <Layout />,
    children: [
        {
            $visibility: "public",
            path: "/page-1",
            element: <Page />,
        }
    ]
});
```

!!!tip
When no `$visibility` indicator is provided, a route is considered `protected`.
!!!

### Register a route with an id

The `registerRoute` function accepts a `parentId` option, allowing a route to be [nested under an existing parent route](#register-nested-routes). When searching for the parent route matching the `parentId` option, the `parentId` will be matched against the `$id` option of every route.

> A `$id` option should only be defined for routes that doesn't have a path like an error boundary or an authentication boundary.

```tsx !#4
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";

runtime.registerRoute({
    $id: "error-boundary",
    element: <RootErrorBoundary />
});
```

### Register nested routes

React router [nested routes](https://reactrouter.com/en/main/start/tutorial#nested-routes) enable applications to render nested layouts at various points within the router tree. This is quite helpful for modular applications as it enables composable and decoupled UI.

To fully harness the power of nested routes, the `registerRoute` function allows a route to be registered **under any** previously **registered route**, even if that route was registered by another module. The only requirement is that the **parent route** must have been registered with the `registerRoute` function.

When registering a new route with the `registerRoute` function, to render the route under a parent route, specify a `parentPath` option that matches the parent route's `path` option:

```tsx !#7
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/layout/page-1",
    element: <Page />
}, { 
    parentPath: "/layout" // Register the route under an existing route having "/layout" as its "path".
});
```

Or a `parentId` option that matches the parent route's `$id` option:

```tsx !#7
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/page-1",
    element: <Page />
}, { 
    parentId: "error-boundary" // Register the route under an existing route having "error-boundary" as its "$id".
});
```

[!ref text="Learn more about using nested routes for modular tabs"](../../guides/use-modular-tabs.md)

!!!tip
The `path` option of a route rendered under an existing parent route must be a React Router absolute path (a path starting with a `/`). For example, if a parent route `path` is `/layout`, the `path` option of a route rendered under that parent route and responding to the `/page-1` url, should be `/layout/page-1`.
!!!

Routes can also be nested by registering multiple routes in a **single registration block**:

```tsx !#7-10
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "/layout",
    element: <Layout />,
    children: [{
        path: "/layout/page-1",
        element: <Page />
    }]
});
```

A single registration block routes can also be define routes with **relative paths** (rather than starting with a `/`):

```tsx !#5,8
import { Layout } from "./Layout.tsx";
import { Page } from "./Page.tsx";

runtime.registerRoute({
    path: "layout",
    element: <Layout />,
    children: [{
        path: "page-1",
        element: <Page />
    }]
});
```

### Retrieve routes

The registered routes are accessible from a `FireflyRuntime` instance, but keep in mind that the preferred way to retrieve the routes is with the [useRoutes](./useRoutes) hook.

```tsx !#1
const routes = runtime.routes;
```

### Register navigation items

```ts !#1
runtime.registerNavigationItem(item, options?: { menuId?, sectionId? })
```

- `item`: `NavigationSection | NavigationLink`.
- `options`: An optional object literal of options:
    - `menuId`: An optional menu id to associate the item with.
    - `sectionId`: An optional section id of a parent navigation section to register this new item under.

A Squide navigation item can either be a `NavigationLink` or a `NavigationSection`. Both types can be intertwined to create a multi-level menu hierarchy. A `NavigationSection` item is used to setup a new level while a `NavigationLink` define a link.

#### `NavigationLink`

Accept any properties of a React Router [Link](https://reactrouter.com/en/main/components/link) component with the addition of:
- `$id`: An optional identifier for the link. Usually used as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The link text.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the link should be rendered.
- `$priority`: An order priority affecting the position of the item in the menu (higher first)
- `$additionalProps`: Additional properties to be forwarded to the link renderer.

#### `NavigationSection`

- `$id`: An optional identifier for the section. Usually used to nest navigation items under a specific section and as the React element [key](https://legacy.reactjs.org/docs/lists-and-keys.html#keys) property.
- `$label`: The section text.
- `$canRender`: An optional function accepting an object and returning a `boolean` indicating whether or not the section should be rendered.
- `$priority`: An order priority affecting the position of the item in the menu (higher first)
- `$additionalProps`: Additional properties to be forwarded to the section renderer.
- `children`: The section content.

!!!tip
We recommend always providing an `$id` option for a navigation item, as it ensures the menus doesn't flicker when [deferred registrations](../registration/initializeFirefly.md#defer-the-registration-of-navigation-items) are updated. Be sure to use a unique identifier.
!!!

```ts !#2-6
// Register a new navigation item from a module.
runtime.registerNavigationItem({
    $id: "page-1",
    $label: "Page 1",
    to: "/page-1"
});
```

[!ref text="Setup the host application to render navigation items"](../routing/useRenderedNavigationItems.md)

### Register a navigation item with an id

The `registerNavigationItem` function accepts a `sectionId` option, allowing a navigation item to be nested under an existing navigation section. When searching the parent navigation section matching the `sectionId` option, the `sectionId` will be match against the `$id` option of every navigation item.

```ts !#1-5
runtime.registerNavigationItem({
    $id: "page-1",
    $label: "Page 1",
    to: "/page-1"
});
```

Additionally, when combined with the [useRenderedNavigationItems]() function, the `$id` option will be used as the React element `key` property.

### Register nested navigation items

Similarly to [nested routes](#register-nested-navigation-items), a navigation item can be nested under an existing section be specifying a `sectionId` option that matches the section's `$id` option:

```ts !#7
runtime.registerNavigationItem({
    $id: "link",
    $label: "Link",
    to: "/link"
}, {
    // The following example takes for granted that a section with the "some-section" $id is already registered or will be registered.
    sectionId: "some-section"
});
```

Navigation items can also be nested by registering multipe items in a single registration block:

```ts !#7-28
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
```

### Register navigation items for a specific menu

By default, every navigation item registered with the `registerNavigationItem` function is registered as part of the `root` navigation menu. To register a navigation item for a different navigation menu, specify a `menuId` option when registering the items.

```tsx !#6
runtime.registerNavigationItem({
    $id: "page-1",
    $label: "Page 1",
    to: "/layout/page-1"
}, { 
    menuId: "my-custom-layout" 
});
```

### Sort navigation items

A `$priority` option can be added to a navigation item to affect it's position in the menu. The sorting algorithm is as follow:

- By default a navigation item have a priority of `0`.
- If no navigation item have a priority, the items are positioned according to their registration order.
- If an item have a priority `> 0`, the item will be positioned before any other items with a lower priority (or without an explicit priority value).
- If an item have a priority `< 0`, the item will be positioned after any other items with a higher priority (or without an explicit priority value).

```ts !#4,13
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
```

### Use dynamic segments for navigation items

```ts !#4
runtime.registerNavigationItem({
    $id: "user-profile",
    $label: "User profile",
    to: "/user-profile/:userId"
});
```

[!ref text="Learn more about rendering navigation items with dynamic segments"](../routing/useRenderedNavigationItems.md#render-dynamic-segments)

### Use a React element as navigation item label

```tsx !#5-8
import { QuestionMarkIcon } from "@sample/icons";

runtime.registerNavigationItem({
    $id: "about",
    $label: (
        <QuestionMarkIcon />
        <span>About</span>
    ),
    to: "/about"
});
```

### Style a navigation item

```ts !#4-6
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    style: {
        backgroundColor: "#000"
    },
    to: "/about"
});
```

### Open a navigation link in a new tab

```ts !#4
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    target: "_blank",
    to: "/about"
});
```

### Conditionally render a navigation item

```ts !#4-6
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    $canRender: (index: number) => {
        return index % 2 == 0;
    },
    to: "/about"
});
```

> It's the responsibility of the code rendering the menu to execute the navigation items `$canRender` function and conditionally render the items based on the return value.

### Render additional props on a navigation item

```ts !#4-6
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    $additionalProps: {
        highlight: true
    },
    to: "/about"
});
```

> It's the responsibility of the code rendering the menu to handle the additional properties.

### Retrieve navigation items

The registered navigation items are accessible from a `FireflyRuntime` instance, but keep in mind that the preferred way to retrieve the navigation items is with the [useNavigationItems](./useNavigationItems) hook.

By default, the `getNavigationItems` will return the navigation items for the `root` menu:

```tsx !#1
const navigationItems = runtime.getNavigationItems();
```

To retrieve the navigation items for a **specific** navigation menu, provide a `menuId`:

```tsx !#1
const navigationItems = runtime.getNavigationItems("my-custom-layout");
```

### Register request handlers

The registered handlers must be valid MSW [request handlers](https://mswjs.io/docs/concepts/request-handler):

```tsx !#3
import { requestHandlers } from "../mocks/handlers.ts";

runtime.registerRequestHandlers(requestHandlers);
```

[!ref text="Learn more about setuping MSW"](../../guides/setup-msw.md)

### Retrieve request handlers

```tsx !#1
const requestHandlers = runtime.requestHandlers;
```

### Log a message

```ts !#3
// Write a debug log entry.
// If the runtime has been instanciated with multiple logger instances, every logger instance will be invoked.
runtime.logger.debug("Hello!");
```

### Use the event bus

```ts !#2,5
// Listen to an event dispatch by the host application or a module.
runtime.eventBus.addListener("write-to-host", () => {});

// Dispatch an event to the host application or a module.
runtime.eventBus.dispatch("write-to-host", "Hello host!");
```

### Register a plugin

The plugin factory function receives the `Runtime` instance as parameter.

```ts !#5
import { FireflyRuntime } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = new FireflyRuntime({
    plugins: [x => new MyPlugin(x)]
});
```

[!ref Learn more about plugins](../plugins/Plugin.md)

### Retrieve a plugin

```ts !#4
import { MyPlugin } from "@sample/my-plugin";

// If the plugin isn't registered, an error is thrown.
const plugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;
```

[!ref Learn more about plugins](../plugins/Plugin.md)
