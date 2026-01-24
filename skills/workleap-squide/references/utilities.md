# Utilities API Reference

## Table of Contents

- [Logging](#logging)
- [Event Bus](#event-bus)
- [Environment Variables](#environment-variables)
- [Feature Flags](#feature-flags)
- [Plugins](#plugins)

## Logging

Squide integrates with `@workleap/logging` for application logging.

### useLogger

Retrieve the logger instance.

```ts
const logger = useLogger();
```

### Logger Methods

```ts
logger.debug("Debug message");
logger.information("Info message");
logger.warning("Warning message");
logger.error("Error message");
```

### Fluent API

```ts
logger
    .withText("Error occurred:")
    .withError(error)
    .error();

logger
    .withText("User data:")
    .withObject({ userId: "123" })
    .information();
```

### Example

```tsx
import { useLogger } from "@squide/firefly";
import { useEffect } from "react";

export function Page() {
    const logger = useLogger();

    useEffect(() => {
        logger.debug("Page component mounted");
    }, [logger]);

    const handleClick = () => {
        logger.information("Button clicked");
    };

    return <button onClick={handleClick}>Click me</button>;
}
```

### Warning

Never log Personally Identifiable Information (PII). API responses often contain sensitive user data. For debugging, use `console.log` instead since its output is not captured in session replays.

## Event Bus

Pub/sub messaging for loosely coupled module communication.

### useEventBusListener

Register an event listener.

```ts
useEventBusListener(
    eventName: string,
    callback: (data: unknown, context: unknown) => void,
    options?: { once?: boolean }
);
```

### useEventBusDispatcher

Get the event dispatcher function.

```ts
const dispatch = useEventBusDispatcher();
dispatch(eventName: string, data?: unknown);
```

### Basic Example

```tsx
import { useCallback } from "react";
import { useEventBusListener, useEventBusDispatcher } from "@squide/firefly";

// Listener in one module
function ModuleA() {
    const handleEvent = useCallback((data, context) => {
        console.log("Received:", data);
    }, []);

    useEventBusListener("user-updated", handleEvent);

    return <div>Module A</div>;
}

// Dispatcher in another module
function ModuleB() {
    const dispatch = useEventBusDispatcher();

    const updateUser = () => {
        dispatch("user-updated", { name: "John" });
    };

    return <button onClick={updateUser}>Update User</button>;
}
```

### One-Time Listener

```tsx
useEventBusListener("initialize-complete", handleInit, { once: true });
```

### Via Runtime

```ts
// Add listener
runtime.eventBus.addListener("event-name", callback);

// Dispatch event
runtime.eventBus.dispatch("event-name", payload);
```

## Environment Variables

Attach configuration to the runtime instead of using `process.env`.

### Benefits

- Better for testing (no global mocking)
- Better for Storybook stories
- Supports modular architecture
- Works in all environments (browsers, workers, edge functions)

### Register at Initialization

```ts
const runtime = initializeFirefly({
    environmentVariables: {
        apiBaseUrl: "https://api.example.com",
        telemetryBaseUrl: "https://telemetry.example.com"
    }
});
```

### Register in Module

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerVariable("apiBaseUrl", "https://api.example.com");

    // Or multiple at once
    runtime.registerVariables({
        apiBaseUrl: "https://api.example.com",
        telemetryBaseUrl: "https://telemetry.example.com"
    });
};
```

### useEnvironmentVariable

Retrieve a single variable.

```tsx
import { useEnvironmentVariable } from "@squide/firefly";

export function ApiClient() {
    const apiBaseUrl = useEnvironmentVariable("apiBaseUrl");

    return <div>API URL: {apiBaseUrl}</div>;
}
```

### useEnvironmentVariables

Retrieve all variables.

```tsx
import { useEnvironmentVariables } from "@squide/firefly";

export function Config() {
    const variables = useEnvironmentVariables();

    return <pre>{JSON.stringify(variables, null, 2)}</pre>;
}
```

### Via Runtime

```ts
const apiBaseUrl = runtime.getEnvironmentVariable("apiBaseUrl");
const allVariables = runtime.environmentVariables;
```

### TypeScript Setup

```ts
// types/env-vars.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        apiBaseUrl: string;
        telemetryBaseUrl: string;
    }
}
```

```json
// tsconfig.json
{
    "compilerOptions": {
        "types": ["./types/env-vars.d.ts"]
    }
}
```

### Testing

```tsx
import { FireflyProvider, FireflyRuntime, EnvironmentVariablesPlugin } from "@squide/firefly";
import { renderHook } from "@testing-library/react";

test("returns absolute URL", () => {
    const runtime = new FireflyRuntime({
        plugins: [x => new EnvironmentVariablesPlugin({
            variables: {
                apiBaseUrl: "https://test-api.com"
            }
        })]
    });

    const { result } = renderHook(() => useAbsoluteUrl("path"), {
        wrapper: ({ children }) => (
            <FireflyProvider runtime={runtime}>
                {children}
            </FireflyProvider>
        )
    });

    expect(result.current).toBe("https://test-api.com/path");
});
```

## Feature Flags

LaunchDarkly integration for feature flags.

### useFeatureFlag

Evaluate a feature flag in React.

```ts
const value = useFeatureFlag(key: string, defaultValue: T): T;
```

```tsx
import { useFeatureFlag } from "@squide/firefly";

export function Page() {
    const showNewFeature = useFeatureFlag("show-new-feature", false);

    if (!showNewFeature) {
        return <LegacyComponent />;
    }

    return <NewComponent />;
}
```

### getFeatureFlag

Evaluate a feature flag outside React.

```ts
import { getFeatureFlag } from "@squide/firefly";

const value = getFeatureFlag(launchDarklyClient, "feature-key", defaultValue);
```

### useLaunchDarklyClient

Access the LaunchDarkly client directly.

```tsx
import { useLaunchDarklyClient } from "@squide/firefly";

export function FeatureFlagDebug() {
    const client = useLaunchDarklyClient();

    const allFlags = client?.allFlags();

    return <pre>{JSON.stringify(allFlags, null, 2)}</pre>;
}
```

### useFeatureFlags

Get all feature flags.

```tsx
import { useFeatureFlags } from "@squide/firefly";

export function FlagsDebug() {
    const flags = useFeatureFlags();

    return <pre>{JSON.stringify(flags, null, 2)}</pre>;
}
```

### Via Runtime

```ts
const flag = runtime.getFeatureFlag("feature-key", defaultValue);
const allFlags = runtime.featureFlags;
const client = runtime.launchDarklyClient;
const enabled = runtime.isLaunchDarklyEnabled;
```

### In Deferred Registrations

```tsx
return (deferredRuntime, { userData }) => {
    // Use deferredRuntime.getFeatureFlag, not runtime.getFeatureFlag
    if (deferredRuntime.getFeatureFlag("enable-admin")) {
        deferredRuntime.registerNavigationItem({
            $id: "admin",
            $label: "Admin",
            to: "/admin"
        });
    }
};
```

### TypeScript Setup

```ts
// types/feature-flags.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface FeatureFlags {
        "show-new-feature": boolean;
        "enable-admin": boolean;
        "max-items": number;
    }
}
```

### Testing

```tsx
import { FireflyProvider, FireflyRuntime, LaunchDarklyPlugin, InMemoryLaunchDarklyClient } from "@squide/firefly";
import { render, screen } from "@testing-library/react";

test("hides feature when flag is off", () => {
    const featureFlags = new Map([
        ["show-new-feature", false]
    ] as const);

    const launchDarklyClient = new InMemoryLaunchDarklyClient(featureFlags);

    const runtime = new FireflyRuntime({
        plugins: [x => new LaunchDarklyPlugin(x, launchDarklyClient)]
    });

    render(
        <FireflyProvider runtime={runtime}>
            <Page />
        </FireflyProvider>
    );

    expect(screen.queryByTestId("new-feature")).not.toBeInTheDocument();
});
```

## Plugins

Extensible plugin system for custom functionality.

### Plugin Interface

```ts
interface Plugin {
    readonly name: string;
}
```

### Register Plugin

```ts
const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

### usePlugin

Retrieve a registered plugin.

```tsx
import { usePlugin } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

export function Component() {
    const myPlugin = usePlugin(MyPlugin.name) as MyPlugin;

    // Use plugin...
}
```

### Via Runtime

```ts
// Throws if not found
const plugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;

// Returns undefined if not found
const maybePlugin = runtime.getPlugin(MyPlugin.name, {
    throwWhenNotFound: false
}) as MyPlugin | undefined;
```

### Built-in Plugins

| Plugin | Description |
|--------|-------------|
| `EnvironmentVariablesPlugin` | Environment variable management |
| `LaunchDarklyPlugin` | Feature flag integration |
| `i18nextPlugin` | Internationalization |
| `MswPlugin` | Mock Service Worker support |
| `HoneycombPlugin` | Observability integration |

### Custom Plugin Example

```ts
// my-plugin/src/MyPlugin.ts
import type { Plugin, FireflyRuntime } from "@squide/firefly";

export class MyPlugin implements Plugin {
    readonly name = "my-plugin";

    private runtime: FireflyRuntime;
    private config: Map<string, unknown> = new Map();

    constructor(runtime: FireflyRuntime) {
        this.runtime = runtime;
    }

    setConfig(key: string, value: unknown) {
        this.config.set(key, value);
    }

    getConfig(key: string) {
        return this.config.get(key);
    }
}
```

```ts
// Usage
const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});

const myPlugin = runtime.getPlugin("my-plugin") as MyPlugin;
myPlugin.setConfig("theme", "dark");
```
