# FireflyRuntime API Reference

## Overview
The `FireflyRuntime` instance gives modules access to routing, navigation, request handlers, logging, and other cross-cutting concerns. Never instantiate directly - use `initializeFirefly()`.

## Table of Contents
- [Constructor Parameters](#constructor-parameters)
- [Route Registration](#route-registration)
- [Navigation Registration](#navigation-registration)
- [MSW Request Handlers](#msw-request-handlers)
- [Environment Variables](#environment-variables)
- [Feature Flags](#feature-flags)
- [Plugins](#plugins)
- [Getters](#getters)
- [Event Bus](#event-bus)
- [Logging](#logging)

## initializeFirefly Options

The preferred way to create a runtime instance. Accepts all `FireflyRuntime` constructor options plus:

```ts
const runtime = initializeFirefly(options?: {
    mode?: "development" | "production";
    localModules?: ModuleRegisterFunction[];   // Local module registration functions
    context?: object;                          // Passed to each module registration function
    useMsw?: boolean;                          // Enable MSW support
    startMsw?: (runtime: FireflyRuntime) => Promise<void>;  // Start MSW (receives the runtime; read runtime.requestHandlers)
    environmentVariables?: Record<string, string>;
    honeycombInstrumentationClient?: HoneycombInstrumentationClient;
    launchDarklyClient?: LDClient;
    loggers?: RootLogger[];
    plugins?: Array<(runtime: FireflyRuntime) => Plugin>;
    onError?: (error: Error) => void;          // Called on bootstrapping errors
})
```

**`context`**: Passed to every module registration function as the second argument:
```tsx
const runtime = initializeFirefly({
    localModules: [register],
    context: { env: "staging" }
});

// In module:
export const register: ModuleRegisterFunction<FireflyRuntime, { env: string }> = (runtime, context) => {
    if (context.env !== "production") { /* ... */ }
};
```

## Constructor Parameters

```ts
new FireflyRuntime(options?: {
    mode?: "development" | "production";
    environmentVariables?: Record<string, string>;
    honeycombInstrumentationClient?: HoneycombInstrumentationClient;
    launchDarklyClient?: LDClient;
    loggers?: RootLogger[];  // e.g., BrowserConsoleLogger from @workleap/logging
    plugins?: Array<(runtime: FireflyRuntime) => Plugin>;
})
```

> For `localModules`, `useMsw`, `startMsw`, `context`, and `onError`, use `initializeFirefly()` — these options are not available on `FireflyRuntime` directly.

## Methods

### Route Registration

#### registerRoute(route, options?)
Register a route.

```ts
runtime.registerRoute({
    path: "/page",
    element: <Page />,
    errorElement: <ErrorBoundary />,  // Optional
    $id: "unique-id",                 // Optional, for nesting
    $visibility: "protected",         // Optional: "public" | "protected"
    children: []                      // Optional nested routes
}, {
    hoist: false,        // If true, registers at router root
    parentPath: "/parent", // Nest under route with this path
    parentId: "parent-id"  // Nest under route with this $id
});
```

**`hoist`:** a hoisted route is added at the root of the router, *outside* the host application's root layout, root error boundary and root authentication boundary, so it has full control over its rendering. Two consequences:

- The rest of the application is no longer isolated from the route's failures — declare an `errorElement` on every hoisted route.
- The route is no longer covered by the application's authentication boundary — wrap it with its own boundary, or handle authentication inside the route.

Hoisting is also how a page gets a layout other than the host's (a login page, for example): register the alternate layout as the hoisted route and nest the page under it.

#### registerPublicRoute(route, options?)
Register a public route (shorthand for `$visibility: "public"`).

```ts
runtime.registerPublicRoute({
    path: "/login",
    element: <LoginPage />
});
```

### Navigation Registration

#### registerNavigationItem(item, options?)
Register a navigation item.

```ts
// Navigation link, registered at the top level of a menu.
runtime.registerNavigationItem({
    $id: "page-id",           // Recommended for stable keys
    $label: "Page Label",     // String or ReactNode
    $priority: 10,            // Higher = earlier among its siblings, at any depth
    $canRender: (index: number) => true,   // Conditional rendering
    $additionalProps: {},     // Spread onto the component the layout renders
    $meta: {},                // Read by the layout, never spread
    to: "/page",
    target: "_blank",         // Optional
    style: {}                 // Optional
}, {
    menuId: "root"            // Target menu (default: "root")
});

// Navigation link, nested under an existing section.
runtime.registerNavigationItem({
    $id: "nested-page-id",
    $label: "Nested Page Label",
    to: "/parent-section/nested-page"
}, {
    menuId: "root",
    sectionId: "parent-section" // Nest under the section whose "$id" is "parent-section"
});

// Navigation section (for nested menus)
runtime.registerNavigationItem({
    $id: "section-id",
    $label: "Section Label",
    children: [
        { $id: "child", $label: "Child", to: "/child" }
    ]
});
```

**`$priority` orders an item among its siblings, at any depth.** It is declared on `NavigationLink`
and `NavigationSection`, so writing one inside a `children` literal or passing one alongside a
`sectionId` option are both valid, and `useRenderedNavigationItems` sorts by it at every level.

Items with no `$priority`, or with the same one, keep the order they were declared in.

This is the answer when asked how to order items inside a section — especially a section several
modules contribute to through `sectionId`, where the items are added in whatever order their
registrations complete and array order is nobody's to control.

`$priority` is *also* forwarded to `renderItem` as the `priority` render prop, exactly as declared
(`undefined` included), for what ordering does not cover: grouping, badging, or a comparator of the
layout's own. If the layout writes one, default a missing priority —
`(y.priority ?? 0) - (x.priority ?? 0)`. A bare `y.priority - x.priority` does not compile, since
`priority` is optional (`TS18048`), and casting the error away makes it worse rather than louder: `NaN`
is read as "these two are equal", the comparator becomes inconsistent, and the items come back
partially reordered.

Neither render callback can reorder anything — `renderItem` sees one item at a time and
`renderSection` receives elements that are already rendered. Pre-sorting the tree does not work either:
the hook sorts every array it receives, so the caller's order is discarded and only ties survive. An
order that contradicts `$priority` requires removing `$priority` from the tree that is handed over, or
not using this hook.

**This used to be top-level only.** Do not repeat the older claim that a nested `$priority` is
ignored.

#### getNavigationItems(options?)
Retrieve registered navigation items for a single menu.

```ts
const items = runtime.getNavigationItems(); // Root menu
const customItems = runtime.getNavigationItems({ menuId: "custom-menu" });
```

#### getNavigationItemsByMenu()
Retrieve the full navigation registry grouped by menu id. Returns a fresh `Map<string, RootNavigationItem[]>` that is reference-stable across calls until the registry changes (registration, deferred completion, or clear).

```ts
const itemsByMenu = runtime.getNavigationItemsByMenu();

for (const [menuId, items] of itemsByMenu) {
    // ...
}
```

### MSW Request Handlers

#### registerRequestHandlers(handlers, options?)
Register MSW request handlers.

```ts
import { requestHandlers } from "../mocks/handlers";

if (runtime.isMswEnabled) {
    runtime.registerRequestHandlers(requestHandlers);
}
```

**Middleware (fall-through) handlers:** MSW evaluates handlers in registration order, and a handler returning nothing falls through to the next matching handler. To register a middleware-like handler (artificial latency, request logging, chaos testing) that must run before the regular handlers, use the `prepend` option:

```ts
import { latencyRequestHandler } from "../mocks/latency.ts";

runtime.registerRequestHandlers([latencyRequestHandler], { prepend: true });
```

Prepended handlers are placed before the appended ones; within each group, the registration order is preserved. Since modules register concurrently, do not rely on the relative order of multiple prepended registrations from different modules.

### Environment Variables

#### registerEnvironmentVariable(key, value)
Register a single environment variable.

```ts
runtime.registerEnvironmentVariable("apiBaseUrl", "https://api.example.com");
```

The same key can be registered multiple times (e.g. by multiple modules) as long as the value remains identical. If the value differs, an `Error` is thrown.

#### registerEnvironmentVariables(variables)
Register multiple environment variables.

```ts
runtime.registerEnvironmentVariables({
    apiBaseUrl: "https://api.example.com",
    cdnUrl: "https://cdn.example.com"
});
```

#### getEnvironmentVariable(key)
Retrieve an environment variable.

```ts
const url = runtime.getEnvironmentVariable("apiBaseUrl");
```

### Feature Flags

#### getFeatureFlag(key, defaultValue?)
Retrieve a LaunchDarkly feature flag value.

```ts
const isEnabled = runtime.getFeatureFlag("feature-key", false);
```

### Plugins

To keep Squide lightweight, not every functionality belongs in the core. The plugin system fills that gap: reach for a plugin to integrate a technology that isn't a core Squide concern (i18next, MSW, LaunchDarkly and environment variables are themselves implemented as plugins).

#### getPlugin(name, options?)
Retrieve a registered plugin.

```ts
import { MyPlugin } from "@sample/my-plugin";

const plugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;

// Without throwing if not found
const plugin = runtime.getPlugin(MyPlugin.name, { throwOnNotFound: false });
```

#### Authoring a plugin (Plugin base class)

Plugins extend the abstract `Plugin` base class. The subclass constructor must call `super(name, runtime)`. Access the runtime via the protected `_runtime` member.

```ts
// my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }

    sayHello() {
        this._runtime.logger.debug("Hello!");
    }
}
```

Pair the plugin with a typed getter to avoid `as MyPlugin` casts at call sites:

```ts
export function getMyPlugin(runtime: FireflyRuntime) {
    return runtime.getPlugin(MyPlugin.name) as MyPlugin;
}
```

## Getters

| Getter | Type | Description |
|--------|------|-------------|
| `mode` | `"development" \| "production"` | Runtime mode |
| `routes` | `Route[]` | Registered routes |
| `requestHandlers` | `RequestHandler[]` | MSW handlers |
| `isMswEnabled` | `boolean` | MSW enabled status |
| `honeycombInstrumentationClient` | `HoneycombInstrumentationClient \| undefined` | Honeycomb client |
| `isLaunchDarklyEnabled` | `boolean` | LaunchDarkly enabled |
| `launchDarklyClient` | `LDClient \| undefined` | LaunchDarkly client |
| `featureFlags` | `Record<string, unknown>` | All feature flags |
| `logger` | `Logger` | Runtime logger |
| `eventBus` | `EventBus` | Event bus instance |
| `plugins` | `Plugin[]` | Registered plugins |
| `environmentVariables` | `Record<string, string>` | All env variables |

## Event Bus

```ts
// Add listener
runtime.eventBus.addListener("event-name", (data, context) => {
    // Handle event
});

// Dispatch event
runtime.eventBus.dispatch("event-name", payload);
```

## Logging

```ts
runtime.logger.debug("Debug message");
runtime.logger.information("Info message");
runtime.logger.warn("Warning message");
runtime.logger.error("Error message");
runtime.logger.critical("Critical message");
```
