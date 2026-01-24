# Integrations Reference

## Table of Contents

- [TanStack Query](#tanstack-query)
- [Mock Service Worker (MSW)](#mock-service-worker-msw)
- [LaunchDarkly](#launchdarkly)
- [i18next](#i18next)
- [Honeycomb](#honeycomb)
- [Logger](#logger)
- [Storybook](#storybook)

## TanStack Query

Server state management and data fetching.

### Setup

```tsx
// host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const runtime = initializeFirefly({
    localModules: [registerHost]
});

const queryClient = new QueryClient();

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools />
        </QueryClientProvider>
    </FireflyProvider>
);
```

### Add Suspense Boundary

```tsx
import { Suspense } from "react";
import { Outlet } from "react-router";

export function RootLayout() {
    return (
        <>
            <nav>{/* navigation */}</nav>
            <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
            </Suspense>
        </>
    );
}
```

### Use in Pages

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";

export function Page() {
    const { data } = useSuspenseQuery({
        queryKey: ["/api/data"],
        queryFn: fetchData
    });

    return <div>{data}</div>;
}
```

## Mock Service Worker (MSW)

API mocking for development.

### Initialize MSW

```bash
pnpx msw init ./public
```

### Create Start Function

```ts
// host/src/mocks/browser.ts
import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export async function startMsw(moduleRequestHandlers: RequestHandler[]) {
    const worker = setupWorker(...moduleRequestHandlers);
    await worker.start({
        onUnhandledRequest: "bypass"
    });
}
```

### Configure Runtime

```tsx
// host/src/index.tsx
const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerHost],
    startMsw: async (x) => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    }
});
```

### Register Handlers in Module

```tsx
// module/src/register.tsx
export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    if (runtime.isMswEnabled) {
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;
        runtime.registerRequestHandlers(requestHandlers);
    }
};
```

### Define Handlers

```ts
// module/src/mocks/handlers.ts
import { HttpResponse, http, type HttpHandler } from "msw";

export const requestHandlers: HttpHandler[] = [
    http.get("/api/data", () => {
        return HttpResponse.json({ message: "Hello" });
    })
];
```

### Environment Variable Setup

```json
// package.json
{
    "scripts": {
        "dev": "cross-env USE_MSW=true rsbuild dev --config ./rsbuild.dev.ts"
    }
}
```

## LaunchDarkly

Feature flags integration.

### Setup

```tsx
// host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";

const launchDarklyClient = initializeLaunchDarkly("YOUR_CLIENT_ID", {
    kind: "user",
    anonymous: true
}, {
    streaming: true  // Required for real-time updates
});

try {
    await launchDarklyClient.waitForInitialization(5);
} catch (error) {
    console.error("Failed to initialize LaunchDarkly");
}

const runtime = initializeFirefly({
    localModules: [registerHost],
    launchDarklyClient
});
```

### Use Feature Flags

#### In React Components

```tsx
import { useFeatureFlag } from "@squide/firefly";

export function Page() {
    const showNewFeature = useFeatureFlag("show-new-feature", false);

    return showNewFeature ? <NewFeature /> : <OldFeature />;
}
```

#### In Non-React Code

```ts
import { getFeatureFlag } from "@squide/firefly";

const value = getFeatureFlag(launchDarklyClient, "feature-key", defaultValue);
```

#### In Deferred Registrations

```tsx
return (deferredRuntime, { userData }) => {
    if (deferredRuntime.getFeatureFlag("enable-admin-panel")) {
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
        "enable-admin-panel": boolean;
    }
}
```

```json
// tsconfig.json
{
    "compilerOptions": {
        "types": ["./types/feature-flags.d.ts"]
    }
}
```

## i18next

Internationalization support.

### Install Packages

```bash
pnpm add @squide/i18next i18next i18next-browser-languagedetector react-i18next
```

### Register Plugin

```tsx
// host/src/index.tsx
import { initializeFirefly } from "@squide/firefly";
import { i18nextPlugin } from "@squide/i18next";

const runtime = initializeFirefly({
    localModules: [registerHost],
    plugins: [x => {
        const plugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language");
        plugin.detectUserLanguage();
        return plugin;
    }]
});
```

### Configure Module

```tsx
// module/src/register.tsx
import { getI18nextPlugin, I18nextNavigationItemLabel } from "@squide/i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesEn from "./locales/en-US/resources.json";
import resourcesFr from "./locales/fr-CA/resources.json";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    const i18nextPlugin = getI18nextPlugin(runtime);

    const i18nextInstance = i18n.createInstance().use(initReactI18next);

    i18nextInstance.init({
        lng: i18nextPlugin.currentLanguage,
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    i18nextPlugin.registerInstance("my-module", i18nextInstance);

    runtime.registerNavigationItem({
        $id: "page",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="page" />,
        to: "/page"
    });
};
```

### Use in Components

```tsx
import { useI18nextInstance } from "@squide/i18next";
import { useTranslation } from "react-i18next";

export function Page() {
    const i18nextInstance = useI18nextInstance("my-module");
    const { t } = useTranslation("Page", { i18n: i18nextInstance });

    return <div>{t("bodyText")}</div>;
}
```

### Change Language

```tsx
import { useChangeLanguage } from "@squide/i18next";

function LanguageSwitcher() {
    const changeLanguage = useChangeLanguage();

    return (
        <button onClick={() => changeLanguage("fr-CA")}>
            Français
        </button>
    );
}
```

### Hooks

| Hook | Description |
|------|-------------|
| `useI18nextInstance(key)` | Get module's i18next instance |
| `useChangeLanguage()` | Get function to change language |
| `useCurrentLanguage()` | Get current language |

## Honeycomb

Observability and performance tracing.

### Install Packages

```bash
pnpm add @workleap/telemetry @opentelemetry/api
```

### Setup

```tsx
// host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { initializeTelemetry } from "@workleap/telemetry/react";

const telemetryClient = initializeTelemetry({
    honeycomb: {
        namespace: "my-app",
        serviceName: "my-app-frontend",
        apiServiceUrls: [/https:\/\/api\.myapp\.com\/.*/],
        options: {
            proxy: "https://collector.myapp.com"
        }
    }
});

const runtime = initializeFirefly({
    localModules: [registerHost],
    honeycombInstrumentationClient: telemetryClient.honeycomb
});
```

### Default Traces

- Bootstrapping flow performance
- Deferred registration updates
- Fetch requests (end-to-end)
- Document load
- Unmanaged errors
- Core Web Vitals (LCP, CLS, INP)

### Set Custom Attributes

```tsx
import { useHoneycombInstrumentationClient } from "@workleap/telemetry/react";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([sessionQuery], isUnauthorized);
    const honeycombClient = useHoneycombInstrumentationClient();

    useEffect(() => {
        if (session) {
            honeycombClient.setGlobalSpanAttributes({
                "app.user_id": session.user.id,
                "app.subscription_status": session.subscription.status
            });
        }
    }, [session]);

    // ...
}
```

### Custom Traces

```tsx
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-tracer");

export function Page() {
    useEffect(() => {
        const span = tracer.startSpan("my-custom-span");
        // ... do work
        span.end();
    }, []);

    return <div>Page</div>;
}
```

## Logger

Logging abstraction supporting multiple destinations.

### Default Behavior

In development mode, a `BrowserConsoleLogger` is automatically added if no loggers are provided.

### Custom Loggers

```tsx
import { initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";

const runtime = initializeFirefly({
    loggers: [new BrowserConsoleLogger()]
});
```

### LogRocket Integration

```tsx
import { initializeFirefly } from "@squide/firefly";
import { LogRocketLogger } from "@workleap/telemetry/react";

const runtime = initializeFirefly({
    mode: "production",
    loggers: [new LogRocketLogger()]
});
```

### Use Logger

```tsx
import { useLogger } from "@squide/firefly";

export function Page() {
    const logger = useLogger();

    useEffect(() => {
        logger.debug("Page mounted");
        logger.information("User viewed page");
        logger.warning("Deprecated feature used");
        logger.error("Operation failed");
    }, [logger]);

    return <div>Page</div>;
}
```

## Storybook

Component development environment with Squide integration.

### Install Packages

```bash
pnpm add msw msw-storybook-addon @squide/firefly-rsbuild-storybook
```

### Configure Preview

```tsx
// .storybook/preview.tsx
import { initialize as initializeMsw, mswLoader } from "msw-storybook-addon";
import { Suspense } from "react";

initializeMsw({ onUnhandledRequest: "bypass" });

const preview = {
    decorators: [
        Story => (
            <Suspense fallback="Loading...">
                <Story />
            </Suspense>
        )
    ],
    loaders: [mswLoader]
};

export default preview;
```

### Story File

```tsx
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    environmentVariables: {
        apiBaseUrl: "https://api.example.com"
    }
});

const meta = {
    title: "Page",
    component: Page,
    decorators: [withFireflyDecorator(runtime)],
    parameters: {
        msw: {
            handlers: runtime.requestHandlers
        }
    }
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
```

### Feature Flags in Stories

```tsx
const featureFlags = new Map([
    ["show-summary", true]
] as const);

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    featureFlags
});

// Override for specific story
import { withFeatureFlagsOverrideDecorator } from "@squide/firefly-rsbuild-storybook";

export const WithoutSummary = {
    decorators: [
        withFeatureFlagsOverrideDecorator(featureFlags, { "show-summary": false })
    ]
} satisfies Story;
```
