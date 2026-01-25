# Squide Hooks API Reference

## Routing Hooks

### useNavigationItems(options?)
Retrieve registered navigation items.

```ts
import { useNavigationItems } from "@squide/firefly";

// Root menu items
const items = useNavigationItems();

// Specific menu items
const customItems = useNavigationItems({ menuId: "custom-menu" });
```

**Returns:** `Array<NavigationLink | NavigationSection>`

### useRenderedNavigationItems(items, renderItem, renderSection)
Transform navigation items into React elements.

```ts
import {
    useRenderedNavigationItems,
    isNavigationLink,
    type RenderItemFunction,
    type RenderSectionFunction
} from "@squide/firefly";

const renderItem: RenderItemFunction = (item, key, index, level) => {
    if (!isNavigationLink(item)) return null;
    const { label, linkProps, additionalProps } = item;
    return (
        <li key={key}>
            <Link {...linkProps} {...additionalProps}>{label}</Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = (elements, key, index, level) => (
    <ul key={key}>{elements}</ul>
);

const elements = useRenderedNavigationItems(items, renderItem, renderSection);
```

### useRoutes()
Retrieve registered routes (prefer using `AppRouter` instead).

```ts
import { useRoutes } from "@squide/firefly";
const routes = useRoutes();
```

### useIsBootstrapping()
Check if application is still bootstrapping.

```ts
import { useIsBootstrapping } from "@squide/firefly";

if (useIsBootstrapping()) {
    return <LoadingSpinner />;
}
```

### useIsRouteProtected()
Check if the current route is protected.

```ts
import { useIsRouteProtected } from "@squide/firefly";
const isProtected = useIsRouteProtected();
```

### useRouteMatch(path)
Check if current route matches a path.

```ts
import { useRouteMatch } from "@squide/firefly";
const matches = useRouteMatch("/users/*");
```

## Data Fetching Hooks

### usePublicDataQueries(queries)
Fetch global public data. Used for data needed on all pages.

```ts
import { usePublicDataQueries } from "@squide/firefly";

const [data1, data2] = usePublicDataQueries([
    {
        queryKey: ["/api/config"],
        queryFn: async () => {
            const response = await fetch("/api/config");
            return response.json();
        }
    },
    {
        queryKey: ["/api/translations"],
        queryFn: async () => {
            const response = await fetch("/api/translations");
            return response.json();
        }
    }
]);
```

**Note:** Requires `<AppRouter waitForPublicData>` to delay rendering.

### useProtectedDataQueries(queries, isUnauthorizedError)
Fetch global protected data. Only fetched for protected routes.

```ts
import { useProtectedDataQueries } from "@squide/firefly";

const [session] = useProtectedDataQueries([
    {
        queryKey: ["/api/session"],
        queryFn: async () => {
            const response = await fetch("/api/session");
            if (!response.ok) throw new ApiError(response.status);
            return response.json();
        }
    }
], error => isApiError(error) && error.status === 401);
```

**Parameters:**
- `queries`: Array of TanStack Query configurations
- `isUnauthorizedError`: Function to detect 401 errors (triggers redirect to login)

**Note:** Requires `<AppRouter waitForProtectedData>` to delay rendering.

### usePublicDataHandler(queryKey)
Access result of a public data query by key.

```ts
import { usePublicDataHandler } from "@squide/firefly";
const handler = usePublicDataHandler(["/api/config"]);
```

### useProtectedDataHandler(queryKey)
Access result of a protected data query by key.

```ts
import { useProtectedDataHandler } from "@squide/firefly";
const handler = useProtectedDataHandler(["/api/session"]);
```

## Registration Hooks

### useDeferredRegistrations(data?)
Execute deferred registration functions.

```ts
import { useDeferredRegistrations } from "@squide/firefly";

// With data for conditional registrations
const data = useMemo(() => ({ userData }), [userData]);
useDeferredRegistrations(data);

// Without data (for feature flags only)
useDeferredRegistrations();
```

**Important:** Use `useMemo` to prevent unnecessary re-executions.

## Messaging Hooks

### useEventBusListener(eventName, handler, options?)
Listen to events from the event bus.

```ts
import { useEventBusListener } from "@squide/firefly";
import { useCallback } from "react";

const handleEvent = useCallback((data, context) => {
    console.log("Event received:", data);
}, []);

// Listen to all events
useEventBusListener("user-updated", handleEvent);

// Listen once
useEventBusListener("init-complete", handleEvent, { once: true });
```

### useEventBusDispatcher()
Get a function to dispatch events.

```ts
import { useEventBusDispatcher } from "@squide/firefly";

const dispatch = useEventBusDispatcher();

// Dispatch event with payload
dispatch("user-updated", { id: 123, name: "John" });
```

## Environment & Configuration Hooks

### useEnvironmentVariable(key)
Get a single environment variable.

```ts
import { useEnvironmentVariable } from "@squide/firefly";
const apiUrl = useEnvironmentVariable("apiBaseUrl");
```

### useEnvironmentVariables()
Get all environment variables.

```ts
import { useEnvironmentVariables } from "@squide/firefly";
const variables = useEnvironmentVariables();
```

### useFeatureFlag(key, defaultValue)
Get a LaunchDarkly feature flag value.

```ts
import { useFeatureFlag } from "@squide/firefly";
const isEnabled = useFeatureFlag("new-feature", false);
```

### useFeatureFlags()
Get all feature flags.

```ts
import { useFeatureFlags } from "@squide/firefly";
const flags = useFeatureFlags();
```

### useLaunchDarklyClient()
Get the LaunchDarkly client instance.

```ts
import { useLaunchDarklyClient } from "@squide/firefly";
const client = useLaunchDarklyClient();
```

## Logging Hooks

### useLogger()
Get the runtime logger instance.

```ts
import { useLogger } from "@squide/firefly";

const logger = useLogger();
logger.debug("Debug message");
logger.information("Info message");
logger.warn("Warning");
logger.error("Error");
logger.critical("Critical");
```

**Warning:** Never log Personally Identifiable Information (PII).

## Runtime Hooks

### useRuntime()
Get the FireflyRuntime instance.

```ts
import { useRuntime } from "@squide/firefly";
const runtime = useRuntime();
```

### useRuntimeMode()
Get the current runtime mode.

```ts
import { useRuntimeMode } from "@squide/firefly";
const mode = useRuntimeMode(); // "development" | "production"
```

## Plugin Hooks

### usePlugin(name)
Get a registered plugin by name.

```ts
import { usePlugin } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const plugin = usePlugin(MyPlugin.name) as MyPlugin;
```

## i18next Hooks

### useI18nextInstance()
Get the i18next instance.

```ts
import { useI18nextInstance } from "@squide/firefly";
const i18n = useI18nextInstance();
```

### useCurrentLanguage()
Get the current language.

```ts
import { useCurrentLanguage } from "@squide/firefly";
const language = useCurrentLanguage();
```

### useChangeLanguage()
Get function to change language.

```ts
import { useChangeLanguage } from "@squide/firefly";
const changeLanguage = useChangeLanguage();
await changeLanguage("fr");
```
