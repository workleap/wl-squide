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
    $priority: 10,            // Higher = earlier in menu. Top-level items only, see below
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

**`$priority` only orders top-level items.** It is declared on `RootNavigationItem`, not on
`NavigationLink` or `NavigationSection`, so `useRenderedNavigationItems` sorts only the array it
receives and recurses into `children` unsorted. There are three ways to nest an item and the type
system now catches two of them:

- Inline, `children: [{ ..., $priority: 10 }]` — a TypeScript excess-property error (`TS2353`).
- Through the option, `registerNavigationItem({ ..., $priority: 10 }, { sectionId })` — a TypeScript
  error (`TS2769`, no overload matches). The `sectionId` overload takes a `NestedNavigationItem`, whose
  `$priority` is typed `never`, so both an object literal and a variable typed `RootNavigationItem` are
  rejected.
- Through a variable placed directly in a `children` array — **compiles, and the priority is ignored.**
  `useRenderedNavigationItems` accepts whatever array it is handed, so this is the one case the types
  cannot reach.

Never suggest any of them to order items inside a section. `$priority` cannot order a nested item, but
ordering itself is possible: the lever is the order of the section's `children` array, which for items
added through `sectionId` is the order in which those registrations run.

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
