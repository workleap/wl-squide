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

**Function Signatures (fixed, no custom parameters):**
- `RenderItemFunction`: `(item: NavigationItemRenderProps, key: string, index: number, level: number) => ReactNode`
- `RenderSectionFunction`: `(elements: ReactNode[], key: string, index: number, level: number) => ReactNode`

**Note:** `useRenderedNavigationItems` invokes these callbacks with the arguments shown above, but your implementation may declare fewer parameters and ignore the rest (for example, `(item, key) => ...`). You cannot supply extra custom context parameters via `useRenderedNavigationItems`; instead, access external values (like route params or location) through closures or React hooks within the component that calls `useRenderedNavigationItems`.

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

### useRouteMatch(locationArg, options?)
Match a location against registered routes using React Router's matching algorithm.

```ts
import { useRouteMatch } from "@squide/firefly";
import { useLocation } from "react-router/dom";

// Using useLocation
const location = useLocation();
const activeRoute = useRouteMatch(location);

// Using window.location
const activeRoute = useRouteMatch(window.location);

// With throwWhenThereIsNoMatch option
const activeRoute = useRouteMatch(location, { throwWhenThereIsNoMatch: true });
```

**Parameters:**
- `locationArg`: The location to match against routes
- `options.throwWhenThereIsNoMatch`: If true, throws an Error when no route matches (default: false)

**Returns:** A `Route` object if there's a match, `undefined` otherwise (or throws if `throwWhenThereIsNoMatch` is true)

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

// Returns the flag value, or defaultValue if not available
const isEnabled = useFeatureFlag("new-feature", false);
```

### useFeatureFlags()
Get all feature flags. Returns a memoized object that only changes when a flag value updates.

```ts
import { useFeatureFlags } from "@squide/firefly";

// Stable reference - only changes when flags actually change
const flags = useFeatureFlags();
```

**Note:** Unlike the LaunchDarkly SDK client which returns a new object on every invocation, this hook returns a memoized object.

### useLaunchDarklyClient()
Get the LaunchDarkly client instance.

```ts
import { useLaunchDarklyClient } from "@squide/firefly";
const client = useLaunchDarklyClient();

// Check if client supports runtime modification
import { isEditableLaunchDarklyClient } from "@squide/firefly";
if (isEditableLaunchDarklyClient(client)) {
    client.setFeatureFlags({ "my-flag": true });
}
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

## i18next Hooks (from `@squide/i18next`)

### useI18nextInstance(key)
Get a registered i18next instance by key.

```ts
import { useI18nextInstance } from "@squide/i18next";
const i18n = useI18nextInstance("an-instance-key");
```

Use with the `useTranslation` hook:

```ts
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

const instance = useI18nextInstance("an-instance-key");
const { t } = useTranslation("a-namespace", { i18n: instance });
```

### useCurrentLanguage()
Get the current language.

```ts
import { useCurrentLanguage } from "@squide/i18next";
const language = useCurrentLanguage();
```

### useChangeLanguage()
Get function to change language.

```ts
import { useChangeLanguage } from "@squide/i18next";
const changeLanguage = useChangeLanguage();
changeLanguage("fr-CA");
```
