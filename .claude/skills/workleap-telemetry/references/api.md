# wl-telemetry API Reference

## Table of Contents

1. [Initialization](#initialization)
2. [TelemetryClient](#telemetryclient)
3. [Honeycomb API](#honeycomb-api)
4. [LogRocket API](#logrocket-api)
5. [Mixpanel API](#mixpanel-api)
6. [Logging API](#logging-api)
7. [Noop Clients](#noop-clients)

---

## Initialization

### `initializeTelemetry(productFamily, options?)`

Initialize all telemetry platforms in a single call.

```typescript
import { initializeTelemetry } from "@workleap/telemetry/react";

const telemetryClient = initializeTelemetry(productFamily, {
  logRocket?: {
    appId: string;                    // Required: LogRocket app ID
    options?: {
      rootHostname?: string;          // Root hostname to track sessions across subdomains, defaults to "workleap.com"
      privateFieldNames?: string[];   // Additional fields removed from network requests/responses via fuzzy matching
      privateQueryParameterNames?: string[];  // Additional query parameters removed from URLs via fuzzy matching
      transformers?: LogRocketSdkOptionsTransformer[];
    }
  },
  honeycomb?: {
    namespace: string;                // Required: Service namespace, added to traces as a `service.namespace` attribute
    serviceName: string;              // Required: Service name in traces
    apiServiceUrls: string | RegExp | (string | RegExp)[];  // Required: URLs to instrument
    options?: {
      proxy?: string;                 // Required if no apiKey: OTEL collector URL. Trace requests are sent with the session credentials, the default metric/log exporters are disabled
      credentials?: RequestCredentials;  // Credentials mode of the proxy trace requests, defaults to "include"
      apiKey?: string;                // Required if no proxy: Honeycomb API key
      instrumentations?: (Instrumentation | Instrumentation[])[];  // HoneycombSdkInstrumentations
      spanProcessors?: SpanProcessor[];
      fetchInstrumentation?: false | ((defaults: FetchInstrumentationConfig) => FetchInstrumentationConfig);
      documentLoadInstrumentation?: false | ((defaults: DocumentLoadInstrumentationConfig) => DocumentLoadInstrumentationConfig);
      xmlHttpRequestInstrumentation?: false | ((defaults: XMLHttpRequestInstrumentationConfig) => XMLHttpRequestInstrumentationConfig);  // Disabled by default; provide a function to enable
      userInteractionInstrumentation?: false | ((defaults: UserInteractionInstrumentationConfig) => UserInteractionInstrumentationConfig);  // Disabled by default; provide a function to enable
      transformers?: HoneycombSdkOptionsTransformer[];
    }
  },
  mixpanel?: {
    envOrTrackingApiBaseUrl: string;  // Required: 'production' | 'staging' | 'development' | 'local' | 'msw' | base URL
    options?: {
      productId?: string;             // Product identifier (e.g., "wlp")
      trackingEndpoint?: string;      // Custom tracking endpoint path, defaults to "tracking/track"
    }
  },
  verbose?: boolean;                  // Enable debug logging. If no `loggers` are configured, logs are automatically sent to the console
  loggers?: RootLogger[];             // Logger instances for diagnostics
});
```

**Parameters:**

- `productFamily`: `"wlp"` (Workleap Platform) or `"sg"` (ShareGate).
- `options`: An optional object literal of options (see above).

**Returns**: `TelemetryClient`

---

## TelemetryClient

Main interface to access platform-specific clients.

### Properties

| Property | Type | Description |
|---|---|---|
| `logRocket` | `LogRocketInstrumentationClient \| undefined` | LogRocket client if configured |
| `honeycomb` | `HoneycombInstrumentationClient \| undefined` | Honeycomb client if configured |
| `mixpanel` | `MixpanelClient \| undefined` | Mixpanel client if configured |

### React Hook

```typescript
import { useTelemetryClient } from "@workleap/telemetry/react";

const telemetryClient = useTelemetryClient();
```

### Provider

```typescript
import { TelemetryProvider } from "@workleap/telemetry/react";

<TelemetryProvider client={telemetryClient}>
  <App />
</TelemetryProvider>
```

---

## Honeycomb API

### `HoneycombInstrumentationClient`

#### Methods

| Method | Description |
|---|---|
| `setGlobalSpanAttribute(key: string, value: any)` | Set single span attribute |
| `setGlobalSpanAttributes(attributes: Record<string, any>)` | Set multiple span attributes |
| `registerFetchRequestHook(hook: FetchRequestHookFunction)` | Add hook at end of pipeline |
| `registerFetchRequestHookAtStart(hook: FetchRequestHookFunction)` | Add hook at start of pipeline |

A `FetchRequestHookFunction` has the signature `(span: Span, request: Request | RequestInit) => void | true`.

A fetch request hook can return `true` to prevent the execution of subsequent hooks in the pipeline.

### React Hook

```typescript
import { useHoneycombInstrumentationClient } from "@workleap/telemetry/react";

const honeycombClient = useHoneycombInstrumentationClient();

// Optional: don't throw if undefined
const honeycombClient = useHoneycombInstrumentationClient({ throwOnUndefined: false });
```

### Custom Traces with OpenTelemetry

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");
const span = tracer.startSpan("operation-name");
span.setAttribute("custom.attribute", "value");
// ... do work
span.end();
```

### Default Honeycomb Features

- Automatic fetch request tracing
- Document load monitoring
- RUM metrics (LCP, CLS, INP)
- Unmanaged error recording

---

## LogRocket API

### `LogRocketInstrumentationClient`

#### Methods

| Method | Description |
|---|---|
| `createWorkleapPlatformDefaultUserTraits(identification)` | Create standard Workleap Platform user traits object |
| `createShareGateDefaultUserTraits(identification)` | Create standard ShareGate user traits object |
| `registerGetSessionUrlListener(listener: (url: string) => void)` | Register callback for session URL. Host applications should use `LogRocket.getSessionURL` instead of this method |

### `createWorkleapPlatformDefaultUserTraits` Parameters

```typescript
{
  userId: string;
  organizationId: string;
  organizationName: string;
  isMigratedToWorkleap: boolean;
  isAdmin: boolean;
  // Optional fields
  isOrganizationCreator?: boolean;
  isReportingManager?: boolean;
  isTeamManager?: boolean;
  isExecutive?: { wov?: boolean; lms?: boolean; onb?: boolean; sks?: boolean; wpm?: boolean; pbd?: boolean; cmp?: boolean };
  isCollaborator?: { wov?: boolean; lms?: boolean; onb?: boolean; sks?: boolean; wpm?: boolean; pbd?: boolean; cmp?: boolean };
  planCode?: { wov?: string; lms?: string; onb?: string; sks?: string; wpm?: string; pbd?: string; cmp?: string };
}
```

### `createShareGateDefaultUserTraits` Parameters

```typescript
{
  shareGateAccountId: string;
  // Optional fields, defaulting to "N/A"
  microsoftUserId?: string;
  microsoftTenantId?: string;
  workspaceId?: string;
}
```

### React Hook

```typescript
import { useLogRocketInstrumentationClient } from "@workleap/telemetry/react";

const logRocketClient = useLogRocketInstrumentationClient();

// Optional: don't throw if undefined
const logRocketClient = useLogRocketInstrumentationClient({ throwOnUndefined: false });
```

### User Identification

```typescript
import LogRocket from "logrocket";
import { useLogRocketInstrumentationClient } from "@workleap/telemetry/react";

const client = useLogRocketInstrumentationClient();
const traits = client.createWorkleapPlatformDefaultUserTraits({
  userId: "6a5e6b06-0cac-44ee-8d2b-00b9419e7da9",
  organizationId: "e6bb30f8-0a00-4928-8943-1630895a3f14",
  organizationName: "Acme",
  isMigratedToWorkleap: true,
  isOrganizationCreator: false,
  isAdmin: false
});

LogRocket.identify(traits["User Id"], traits);
```

### Privacy Controls

By default, all user-provided text inputs and content are sanitized.

- `data-public`: Explicitly allow DOM recording
- `data-private`: Block recording within a public area

---

## Mixpanel API

### `MixpanelClient`

#### Methods

| Method | Description |
|---|---|
| `createTrackingFunction(options?)` | Create tracking function |
| `setGlobalEventProperty(key: string, value: any)` | Set single global property |
| `setGlobalEventProperties(properties: Record<string, any>)` | Set multiple global properties |

### `createTrackingFunction` Options

```typescript
{
  productId?: string;       // Product identifier
  targetProductId?: string;  // For cross-product events
}
```

When a `productId` is provided both to `initializeTelemetry` and as an option to `createTrackingFunction`, the value passed to `createTrackingFunction` takes precedence.

### Tracking Function Signature

```typescript
(
  eventName: string,
  properties: Record<string, any>,
  options?: { keepAlive?: boolean }
): Promise<void>
```

### React Hooks

```typescript
import { useMixpanelClient, useMixpanelTrackingFunction } from "@workleap/telemetry/react";

// Get client
const mixpanelClient = useMixpanelClient();

// Get tracking function directly (convenience)
const track = useMixpanelTrackingFunction();

// With product id
const track = useMixpanelTrackingFunction({ productId: "wlp" });

// For cross-product tracking
const trackWov = useMixpanelTrackingFunction({ targetProductId: "wov" });

// Optional: don't throw if undefined
const mixpanelClient = useMixpanelClient({ throwOnUndefined: false });
```

### Event Tracking

```typescript
const track = useMixpanelTrackingFunction();

// Standard event
track("ButtonClicked", { Trigger: "ChangePlan", Location: "Header" });

// Link tracking (keeps page alive)
track("LinkClicked", { Link: "Pricing" }, { keepAlive: true });
```

### `MixpanelPropertiesProvider`

A React provider to define scoped Mixpanel properties. Properties defined with this provider are automatically included in events tracked by nested components using `useMixpanelTrackingFunction`.

```typescript
import { MixpanelPropertiesProvider } from "@workleap/telemetry/react";

// Define properties as a static object (outside component or memoized)
const MixpanelProperties = {
  section: "User Form"
};

function App() {
  return (
    <MixpanelPropertiesProvider value={MixpanelProperties}>
      <NestedComponent />
    </MixpanelPropertiesProvider>
  );
}
```

### `useMixpanelProviderProperties`

Retrieve the properties defined by the nearest `MixpanelPropertiesProvider`.

```typescript
import { useMixpanelProviderProperties } from "@workleap/telemetry/react";

const props = useMixpanelProviderProperties();
```

---

## Logging API

### `LogRocketLogger`

Send logs to LogRocket console capture.

```typescript
import { LogRocketLogger } from "@workleap/telemetry/react";
import { LogLevel } from "@workleap/logging";

const logger = new LogRocketLogger({
  logLevel?: LogLevel.debug | LogLevel.information | LogLevel.warning | LogLevel.error | LogLevel.critical
});
```

### Logger Methods

| Method | Description |
|---|---|
| `debug(message: string)` | Debug level log |
| `information(message: string)` | Information level log |
| `warning(message: string)` | Warning level log |
| `error(message: string)` | Error level log |
| `critical(message: string)` | Critical level log |
| `withText(text: string)` | Chain text segment |
| `withObject(obj: any)` | Chain object segment |
| `withError(error: Error)` | Chain error segment |
| `startScope(name: string)` | Start scoped logging |

### Usage Example

```typescript
import { LogRocketLogger } from "@workleap/telemetry/react";
import { LogLevel } from "@workleap/logging";

const logger = new LogRocketLogger({ logLevel: LogLevel.information });

// Simple logging
logger.information("User logged in");

// Complex logging
logger
  .withText("Processing step")
  .withObject({ id: 123, status: "started" })
  .information();

// Scoped logging
const scope = logger.startScope("User Login");
scope.information("Starting authentication...");
// ... more logs
scope.end();

// Dismiss a scope (prevents log output)
scope.end({ dismiss: true });
```

### Providing Loggers to Initialization

```typescript
import { initializeTelemetry, LogRocketLogger } from "@workleap/telemetry/react";
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

const telemetryClient = initializeTelemetry("sg", {
  // ... config
  loggers: [new BrowserConsoleLogger(), new LogRocketLogger({ logLevel: LogLevel.information })],
  verbose: true
});
```

---

## Noop Clients

Fake implementation for testing and Storybook.

| Class | Purpose |
|---|---|
| `NoopTelemetryClient` | Fake TelemetryClient for use in non-standard contexts |

### Usage

```typescript
import { NoopTelemetryClient, TelemetryProvider } from "@workleap/telemetry/react";

const telemetryClient = new NoopTelemetryClient();

<TelemetryProvider client={telemetryClient}>
  <ComponentUnderTest />
</TelemetryProvider>
```
