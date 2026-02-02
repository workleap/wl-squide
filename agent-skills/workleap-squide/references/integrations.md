# Squide Integrations Reference

## TanStack Query

### Setup

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </FireflyProvider>
);
```

### DevTools (Development Only)

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools />
        </QueryClientProvider>
    </FireflyProvider>
);
```

### Page Data with Suspense

```tsx
// Layout with Suspense
export function RootLayout() {
    return (
        <>
            <nav>{navigationElements}</nav>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}

// Page component
import { useSuspenseQuery } from "@tanstack/react-query";

function Page() {
    const { data } = useSuspenseQuery({
        queryKey: ["/api/data"],
        queryFn: async () => {
            const response = await fetch("/api/data");
            return response.json();
        }
    });

    return <div>{data.content}</div>;
}
```

## MSW (Mock Service Worker)

### Initialize

```bash
pnpx msw init ./public
```

### Create Start Function

```ts
// mocks/browser.ts
import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export async function startMsw(handlers: RequestHandler[]) {
    const worker = setupWorker(...handlers);
    await worker.start({ onUnhandledRequest: "bypass" });
}
```

### Configure Runtime

```tsx
const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerHost],
    startMsw: async x => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    }
});
```

### Register Handlers in Module

```tsx
// Always use dynamic import
export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        const { requestHandlers } = await import("./mocks/handlers.ts");
        runtime.registerRequestHandlers(requestHandlers);
    }
};

// mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";

export const requestHandlers: HttpHandler[] = [
    http.get("/api/data", () => {
        return HttpResponse.json({ message: "Hello" });
    })
];
```

## LaunchDarkly

### Initialize Client

```ts
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";

const ldClient = initializeLaunchDarkly(
    "your-client-id",
    { kind: "user", anonymous: true },
    { streaming: true }  // Important for real-time updates
);

await ldClient.waitForInitialization(5);
```

### Configure Runtime with LaunchDarklyPlugin

```ts
import { initializeFirefly, LaunchDarklyPlugin } from "@squide/firefly";

const runtime = initializeFirefly({
    plugins: [x => new LaunchDarklyPlugin(x, ldClient)]
});
```

### Use Feature Flags

```tsx
// In React components
import { useFeatureFlag } from "@squide/firefly";
const isEnabled = useFeatureFlag("feature-key", false);

// Get all feature flags (memoized, stable reference until flags change)
import { useFeatureFlags } from "@squide/firefly";
const flags = useFeatureFlags();

// Get the LaunchDarkly client instance
import { useLaunchDarklyClient } from "@squide/firefly";
const client = useLaunchDarklyClient();

// In non-React code
import { getFeatureFlag } from "@squide/firefly";
const isEnabled = getFeatureFlag(ldClient, "feature-key", false);

// In deferred registrations
return (deferredRuntime, data) => {
    if (deferredRuntime.getFeatureFlag("show-feature")) {
        deferredRuntime.registerNavigationItem({ ... });
    }
};
```

### TypeScript Augmentation (FeatureFlags Interface)

Create a type declaration file to get type-safe feature flags:

```ts
// types/feature-flags.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface FeatureFlags {
        "feature-key": boolean;
        "another-feature": string;
    }
}
```

Then reference it in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "types": ["./types/feature-flags.d.ts"]
    }
}
```

### FeatureFlagSetSnapshot

A class that tracks and memoizes feature flags, returning a stable object reference until flags change:

```ts
import { FeatureFlagSetSnapshot } from "@squide/firefly";

const snapshot = new FeatureFlagSetSnapshot(ldClient);

// Get current flags
const flags = snapshot.value;

// Listen for changes
snapshot.addSnapshotChangedListener((newSnapshot, changes) => {
    console.log("Flags changed:", changes);
});

// Remove listener
snapshot.removeSnapshotChangedListener(listener);
```

### Testing with InMemoryLaunchDarklyClient

An in-memory client for testing without connecting to LaunchDarkly:

```tsx
import { InMemoryLaunchDarklyClient, LaunchDarklyPlugin } from "@squide/firefly";
import { FireflyRuntime } from "@squide/firefly";

const featureFlags = {
    "feature-key": true,
    "another-feature": "value"
};

const ldClient = new InMemoryLaunchDarklyClient(featureFlags);

const runtime = new FireflyRuntime({
    plugins: [x => new LaunchDarklyPlugin(x, ldClient)]
});

// Update flags at runtime
ldClient.setFeatureFlags({
    "feature-key": false,
    "another-feature": "new-value"
});
```

With custom context:

```ts
const ldClient = new InMemoryLaunchDarklyClient(featureFlags, {
    context: {
        kind: "multi",
        user: { key: "user-123", name: "Sandy" },
        org: { key: "org-456", name: "Acme Inc" }
    }
});
```

### LocalStorageLaunchDarklyClient

A client that persists feature flags to localStorage:

```ts
import { createLocalStorageLaunchDarklyClient, LaunchDarklyPlugin, FireflyRuntime } from "@squide/firefly";

const defaultFeatureFlags = {
    "feature-key": true,
    "another-feature": "default"
};

const ldClient = createLocalStorageLaunchDarklyClient(defaultFeatureFlags);

const runtime = new FireflyRuntime({
    plugins: [x => new LaunchDarklyPlugin(x, ldClient)]
});

// Update flags (persisted to localStorage)
ldClient.setFeatureFlags({
    "feature-key": false
});
```

With custom storage key:

```ts
const ldClient = createLocalStorageLaunchDarklyClient(defaultFeatureFlags, {
    localStorageKey: "my-app-flags"
});
```

### isEditableLaunchDarklyClient

Check if a client supports runtime flag modification:

```tsx
import { isEditableLaunchDarklyClient, useFeatureFlag, useLaunchDarklyClient } from "@squide/firefly";
import { useCallback } from "react";

function FeatureFlagToggle() {
    const enabled = useFeatureFlag("show-characters", false);
    const ldClient = useLaunchDarklyClient();

    const handleToggle = useCallback(() => {
        if (isEditableLaunchDarklyClient(ldClient)) {
            ldClient.setFeatureFlags({
                "show-characters": !enabled
            });
        }
    }, [enabled, ldClient]);

    return (
        <button onClick={handleToggle} disabled={!isEditableLaunchDarklyClient(ldClient)}>
            Toggle Feature
        </button>
    );
}
```

## Honeycomb

### Setup with @workleap/telemetry

```tsx
import { initializeTelemetry } from "@workleap/telemetry/react";

const telemetryClient = initializeTelemetry({
    honeycomb: {
        namespace: "my-app",
        serviceName: "my-service",
        apiServiceUrls: [/.+/g],
        options: {
            proxy: "https://my-proxy.com"
        }
    }
});

const runtime = initializeFirefly({
    honeycombInstrumentationClient: telemetryClient.honeycomb
});
```

### Set Custom Attributes

```tsx
import { useHoneycombInstrumentationClient } from "@workleap/telemetry/react";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([...]);
    const honeycomb = useHoneycombInstrumentationClient();

    useEffect(() => {
        if (session) {
            honeycomb.setGlobalSpanAttributes({
                "app.user_id": session.userId,
                "app.tenant_id": session.tenantId
            });
        }
    }, [session]);
}
```

## i18next

### Setup Plugin

```ts
import { i18nextPlugin } from "@squide/i18next";
import { FireflyRuntime } from "@squide/firefly";

const runtime = new FireflyRuntime({
    plugins: [x => {
        const plugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language");
        plugin.detectUserLanguage();
        return plugin;
    }]
});
```

### Register i18next Instance

```ts
import { i18nextPlugin, i18nextPluginName } from "@squide/i18next";
import i18n from "i18next";

const instance = i18n.createInstance({
    resources: {
        "en-US": resourcesEn,
        "fr-CA": resourcesFr
    }
});

const plugin = runtime.getPlugin(i18nextPluginName) as i18nextPlugin;
plugin.registerInstance("an-instance-key", instance);
```

### Use in Components

```tsx
import { useI18nextInstance, useCurrentLanguage, useChangeLanguage } from "@squide/i18next";

function LanguageSwitcher() {
    const currentLanguage = useCurrentLanguage();
    const changeLanguage = useChangeLanguage();

    return (
        <select
            value={currentLanguage}
            onChange={e => changeLanguage(e.target.value)}
        >
            <option value="en-US">English</option>
            <option value="fr-CA">French</option>
        </select>
    );
}
```

### Localized Navigation Labels

```tsx
import { I18nextNavigationItemLabel } from "@squide/i18next";

runtime.registerNavigationItem({
    $id: "home",
    $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="nav.home" />,
    to: "/"
});
```

## Storybook

### Setup Decorator

```tsx
// .storybook/preview.tsx
import { withFireflyDecorator, initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    title: "Page",
    component: Page,
    decorators: [
        withFireflyDecorator(runtime)
    ],
    parameters: {
        msw: {
            handlers: [...runtime.requestHandlers]
        }
    }
};
```

### With Feature Flags

```tsx
import { initializeFireflyForStorybook, withFireflyDecorator, withFeatureFlagsOverrideDecorator } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    featureFlags: {
        "feature-key": true
    }
});

const meta = {
    decorators: [
        withFireflyDecorator(runtime)
    ]
};

// Override per-story
export const WithFeatureDisabled = {
    decorators: [
        withFeatureFlagsOverrideDecorator({ "feature-key": false })
    ]
};
```

### With Environment Variables

```tsx
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    environmentVariables: {
        apiBaseUrl: "https://mock-api.example.com"
    }
});
```

### Without MSW Support

```tsx
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = await initializeFireflyForStorybook({
    useMsw: false
});
```

## Logging with @workleap/logging

### Setup

```ts
import { BrowserConsoleLogger } from "@workleap/logging";

const runtime = initializeFirefly({
    loggers: [new BrowserConsoleLogger()]
});
```

### Multiple Loggers

```ts
import { BrowserConsoleLogger, LogRocketLogger } from "@workleap/logging";

const runtime = initializeFirefly({
    loggers: [
        new BrowserConsoleLogger(),
        new LogRocketLogger()
    ]
});
```

### Use in Components

```tsx
import { useLogger } from "@squide/firefly";

function Component() {
    const logger = useLogger();

    const handleClick = () => {
        logger.info("Button clicked");
    };

    return <button onClick={handleClick}>Click</button>;
}
```

### Log Levels

```ts
logger.debug("Debug message");      // Verbose debugging
logger.information("Info message"); // General information
logger.warn("Warning message");     // Potential issues
logger.error("Error message");      // Errors
logger.error("Critical message");   // Criticals

// With structured data
logger
    .withText("Operation failed")
    .withError(error)
    .withObject({ userId, action })
    .error();
```

**Warning:** Never log Personally Identifiable Information (PII). API responses often contain sensitive data that will appear in session replays.
