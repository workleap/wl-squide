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

### Configure Runtime

```ts
const runtime = initializeFirefly({
    launchDarklyClient: ldClient
});
```

### Use Feature Flags

```tsx
// In React components
import { useFeatureFlag } from "@squide/firefly";
const isEnabled = useFeatureFlag("feature-key", false);

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

### TypeScript Augmentation

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

### Testing with Feature Flags

```tsx
import { InMemoryLaunchDarklyClient, LaunchDarklyPlugin } from "@squide/firefly";

const flags = new Map([["feature-key", true]]);
const ldClient = new InMemoryLaunchDarklyClient(flags);

const runtime = new FireflyRuntime({
    plugins: [x => new LaunchDarklyPlugin(x, ldClient)]
});
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
import { i18nextPlugin } from "@squide/firefly";
import i18next from "i18next";

await i18next.init({ ... });

const runtime = initializeFirefly({
    plugins: [x => i18nextPlugin(x, i18next)]
});
```

### Use in Components

```tsx
import { useI18nextInstance, useCurrentLanguage, useChangeLanguage } from "@squide/firefly";

function LanguageSwitcher() {
    const currentLanguage = useCurrentLanguage();
    const changeLanguage = useChangeLanguage();

    return (
        <select
            value={currentLanguage}
            onChange={e => changeLanguage(e.target.value)}
        >
            <option value="en">English</option>
            <option value="fr">French</option>
        </select>
    );
}
```

### Localized Navigation Labels

```tsx
import { I18nextNavigationItemLabel } from "@squide/firefly";

runtime.registerNavigationItem({
    $id: "home",
    $label: <I18nextNavigationItemLabel i18next={i18next} resourceKey="nav.home" />,
    to: "/"
});
```

## Storybook

### Setup Decorator

```tsx
// .storybook/preview.tsx
import { withFireflyDecorator, initializeFireflyForStorybook } from "@squide/firefly";
import { MemoryRouter } from "react-router";

const runtime = initializeFireflyForStorybook();

export const decorators = [
    withFireflyDecorator(runtime),
    (Story) => (
        <MemoryRouter>
            <Story />
        </MemoryRouter>
    )
];
```

### With Feature Flags

```tsx
import { withFeatureFlagsOverrideDecorator } from "@squide/firefly";

export const decorators = [
    withFeatureFlagsOverrideDecorator({
        "feature-key": true
    }),
    withFireflyDecorator(runtime)
];
```

### Per-Story Feature Flags

```tsx
export const WithFeatureEnabled = {
    decorators: [
        withFeatureFlagsOverrideDecorator({ "my-feature": true })
    ]
};

export const WithFeatureDisabled = {
    decorators: [
        withFeatureFlagsOverrideDecorator({ "my-feature": false })
    ]
};
```

### With Environment Variables

```tsx
const runtime = initializeFireflyForStorybook({
    environmentVariables: {
        apiBaseUrl: "https://mock-api.example.com"
    }
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
logger.debug("Debug message");    // Verbose debugging
logger.info("Info message");      // General information
logger.warn("Warning message");   // Potential issues
logger.error("Error message");    // Errors

// With structured data
logger
    .withText("Operation failed")
    .withError(error)
    .withObject({ userId, action })
    .error();
```

**Warning:** Never log Personally Identifiable Information (PII). API responses often contain sensitive data that will appear in session replays.
