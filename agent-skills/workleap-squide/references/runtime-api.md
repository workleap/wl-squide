# FireflyRuntime API Reference

## Overview
The `FireflyRuntime` instance gives modules access to routing, navigation, request handlers, logging, and other cross-cutting concerns. Never instantiate directly - use `initializeFirefly()`.

## Constructor Parameters

```ts
new FireflyRuntime(options?: {
    mode?: "development" | "production";
    environmentVariables?: Record<string, string>;
    honeycombInstrumentationClient?: HoneycombInstrumentationClient;
    launchDarklyClient?: LDClient;
    loggers?: Logger[];
    plugins?: Array<(runtime: FireflyRuntime) => Plugin>;
})
```

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
// Navigation link
runtime.registerNavigationItem({
    $id: "page-id",           // Recommended for stable keys
    $label: "Page Label",     // String or ReactNode
    $priority: 10,            // Higher = earlier in menu
    $canRender: () => true,   // Conditional rendering
    $additionalProps: {},     // Custom props for renderer
    to: "/page",
    target: "_blank",         // Optional
    style: {}                 // Optional
}, {
    menuId: "root",           // Target menu (default: "root")
    sectionId: "parent-section" // Nest under this section
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

#### getNavigationItems(menuId?)
Retrieve registered navigation items.

```ts
const items = runtime.getNavigationItems(); // Root menu
const customItems = runtime.getNavigationItems("custom-menu");
```

### MSW Request Handlers

#### registerRequestHandlers(handlers)
Register MSW request handlers.

```ts
import { requestHandlers } from "../mocks/handlers";

if (runtime.isMswEnabled) {
    runtime.registerRequestHandlers(requestHandlers);
}
```

### Environment Variables

#### registerEnvironmentVariable(key, value)
Register a single environment variable.

```ts
runtime.registerEnvironmentVariable("apiBaseUrl", "https://api.example.com");
```

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

#### getPlugin(name, options?)
Retrieve a registered plugin.

```ts
import { MyPlugin } from "@sample/my-plugin";

const plugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;

// Without throwing if not found
const plugin = runtime.getPlugin(MyPlugin.name, { throwWhenNotFound: false });
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
