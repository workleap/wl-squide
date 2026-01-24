# FireflyRuntime API Reference

## Table of Contents

- [initializeFirefly](#initializefirefly)
- [FireflyRuntime Methods](#fireflyruntime-methods)
- [Route Registration](#route-registration)
- [Navigation Items](#navigation-items)
- [MSW Request Handlers](#msw-request-handlers)
- [Environment Variables](#environment-variables)
- [Feature Flags](#feature-flags)
- [Plugins](#plugins)
- [Logging](#logging)
- [Event Bus](#event-bus)

## initializeFirefly

Create a FireflyRuntime instance and register local modules.

```ts
const runtime = initializeFirefly(options?: {
    mode?: "development" | "production",
    localModules?: ModuleRegisterFunction[],
    context?: object,
    useMsw?: boolean,
    startMsw?: (runtime) => Promise<void>,
    environmentVariables?: Record<string, unknown>,
    honeycombInstrumentationClient?: HoneycombInstrumentationClient,
    launchDarklyClient?: LDClient,
    loggers?: Logger[],
    plugins?: ((runtime) => Plugin)[],
    onError?: (error: Error) => void
})
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `mode` | `"development"` \| `"production"` | Runtime mode. Default: `"development"` |
| `localModules` | `ModuleRegisterFunction[]` | Array of module registration functions |
| `context` | `object` | Context object passed to registration functions |
| `useMsw` | `boolean` | Enable Mock Service Worker support |
| `startMsw` | `(runtime) => Promise<void>` | Function to start MSW with request handlers |
| `environmentVariables` | `Record<string, unknown>` | Initial environment variables |
| `honeycombInstrumentationClient` | `HoneycombInstrumentationClient` | Honeycomb client for tracing |
| `launchDarklyClient` | `LDClient` | LaunchDarkly client for feature flags |
| `loggers` | `Logger[]` | Array of logger instances |
| `plugins` | `((runtime) => Plugin)[]` | Array of plugin factory functions |
| `onError` | `(error: Error) => void` | Error handler for bootstrapping errors |

### Basic Example

```tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register as registerModule } from "@my-app/local-module";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    localModules: [registerModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

### With MSW

```tsx
const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerModule],
    startMsw: async (x) => {
        return (await import("../mocks/browser.ts")).startMsw(x.requestHandlers);
    }
});
```

### With Registration Context

```tsx
const runtime = initializeFirefly({
    localModules: [registerModule],
    context: {
        env: "staging"
    }
});

// In module:
export const register: ModuleRegisterFunction<FireflyRuntime, { env: string }> = (runtime, context) => {
    console.log(context.env); // "staging"
};
```

## FireflyRuntime Methods

### Route Registration

#### registerRoute

```ts
runtime.registerRoute(route, options?: { hoist?, parentPath?, parentId? })
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `route` | `RouteObject` | React Router route object with Squide extensions |
| `options.hoist` | `boolean` | Register at router root (outside layouts) |
| `options.parentPath` | `string` | Path of parent route to nest under |
| `options.parentId` | `string` | ID of parent route to nest under |

**Route Extensions:**
- `$id`: Optional identifier for nesting other routes
- `$visibility`: `"public"` or `"protected"` (default: `"protected"`)

```tsx
// Basic route
runtime.registerRoute({
    path: "/page",
    element: <Page />
});

// Route with ID for nesting
runtime.registerRoute({
    $id: "error-boundary",
    element: <ErrorBoundary />
});

// Nested route
runtime.registerRoute({
    path: "/layout/page",
    element: <Page />
}, { parentPath: "/layout" });

// Hoisted route
runtime.registerRoute({
    path: "/standalone",
    element: <Standalone />,
    errorElement: <StandaloneError />
}, { hoist: true });
```

#### registerPublicRoute

Register a route as public (no authentication required):

```tsx
runtime.registerPublicRoute({
    path: "/login",
    element: <LoginPage />
});
```

### Navigation Items

#### registerNavigationItem

```ts
runtime.registerNavigationItem(item, options?: { menuId?, sectionId? })
```

**NavigationLink properties:**
- `$id`: Unique identifier (recommended)
- `$label`: Display text or React element
- `$priority`: Sort order (higher first)
- `$canRender`: Function returning boolean for conditional rendering
- `$additionalProps`: Additional props passed to renderer
- `to`: Link destination (required)
- `target`: Link target (e.g., `"_blank"`)
- `style`: Inline styles

**NavigationSection properties:**
- `$id`: Unique identifier
- `$label`: Section label
- `$priority`: Sort order
- `$canRender`: Conditional render function
- `$additionalProps`: Additional props
- `children`: Nested items

```tsx
// Basic link
runtime.registerNavigationItem({
    $id: "home",
    $label: "Home",
    to: "/"
});

// With priority
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    $priority: 10,
    to: "/about"
});

// With React element label
runtime.registerNavigationItem({
    $id: "help",
    $label: (
        <>
            <HelpIcon />
            <span>Help</span>
        </>
    ),
    to: "/help"
});

// Nested under section
runtime.registerNavigationItem({
    $id: "settings",
    $label: "Settings",
    to: "/settings"
}, { sectionId: "admin" });

// For custom menu
runtime.registerNavigationItem({
    $id: "sidebar-item",
    $label: "Sidebar Item",
    to: "/sidebar"
}, { menuId: "sidebar-menu" });
```

#### getNavigationItems

```ts
const items = runtime.getNavigationItems(menuId?: string);
```

### MSW Request Handlers

#### registerRequestHandlers

```ts
runtime.registerRequestHandlers(handlers: RequestHandler[])
```

```tsx
if (runtime.isMswEnabled) {
    const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;
    runtime.registerRequestHandlers(requestHandlers);
}
```

#### isMswEnabled

```ts
const enabled = runtime.isMswEnabled; // boolean
```

#### requestHandlers

```ts
const handlers = runtime.requestHandlers; // RequestHandler[]
```

### Environment Variables

#### registerVariable / registerVariables

```ts
runtime.registerVariable(key: string, value: unknown);
runtime.registerVariables(variables: Record<string, unknown>);
```

```tsx
runtime.registerVariable("apiBaseUrl", "https://api.example.com");

runtime.registerVariables({
    apiBaseUrl: "https://api.example.com",
    telemetryUrl: "https://telemetry.example.com"
});
```

#### getEnvironmentVariable

```ts
const value = runtime.getEnvironmentVariable(key: string);
```

#### environmentVariables

```ts
const allVars = runtime.environmentVariables; // Record<string, unknown>
```

### Feature Flags

#### getFeatureFlag

```ts
const value = runtime.getFeatureFlag(key: string, defaultValue?: T);
```

```tsx
const showNewFeature = runtime.getFeatureFlag("show-new-feature", false);
```

#### featureFlags

```ts
const flags = runtime.featureFlags; // Record<string, unknown>
```

#### launchDarklyClient

```ts
const client = runtime.launchDarklyClient; // LDClient | undefined
```

#### isLaunchDarklyEnabled

```ts
const enabled = runtime.isLaunchDarklyEnabled; // boolean
```

### Plugins

#### Register plugin

```ts
const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

#### getPlugin

```ts
const plugin = runtime.getPlugin(name: string, options?: { throwWhenNotFound?: boolean });
```

```tsx
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;

// Without throwing if not found
const maybePlugin = runtime.getPlugin(MyPlugin.name, { throwWhenNotFound: false });
```

### Logging

#### logger

```ts
runtime.logger.debug("Debug message");
runtime.logger.information("Info message");
runtime.logger.warning("Warning message");
runtime.logger.error("Error message");
```

### Event Bus

#### eventBus

```ts
// Add listener
runtime.eventBus.addListener("event-name", (data, context) => {
    // Handle event
});

// Dispatch event
runtime.eventBus.dispatch("event-name", payload);
```

### Honeycomb

#### honeycombInstrumentationClient

```ts
const client = runtime.honeycombInstrumentationClient;
```

### Mode

#### mode

```ts
const mode = runtime.mode; // "development" | "production"
```

## Module Registration Function Type

```ts
type ModuleRegisterFunction<
    TRuntime extends Runtime = Runtime,
    TContext = unknown,
    TData = unknown
> = (
    runtime: TRuntime,
    context?: TContext
) => Promise<DeferredRegistrationFunction<TData> | void> | DeferredRegistrationFunction<TData> | void;

type DeferredRegistrationFunction<TData = unknown> = (
    runtime: DeferredRegistrationRuntime,
    data: TData,
    operation: "register" | "update"
) => Promise<void> | void;
```
