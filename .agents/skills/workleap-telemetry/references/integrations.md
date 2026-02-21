# wl-telemetry Integration Patterns

## Table of Contents

1. [Honeycomb Integration](#honeycomb-integration)
2. [LogRocket Integration](#logrocket-integration)
3. [Mixpanel Integration](#mixpanel-integration)
4. [Cross-Platform Correlation](#cross-platform-correlation)

---

## Honeycomb Integration

### Purpose

Honeycomb provides distributed tracing and performance monitoring for understanding system behavior and diagnosing issues.

### Default Instrumentation

When Honeycomb is configured, wl-telemetry automatically instruments:

| Feature | Description |
|---|---|
| Fetch requests | All HTTP requests via fetch API |
| Document load | Page load timing metrics |
| RUM metrics | Core Web Vitals (LCP, CLS, INP) |
| Unmanaged errors | Uncaught exceptions |

### Configuration Options

```typescript
honeycomb: {
  namespace: "your-namespace",     // Required: Trace namespace
  serviceName: "your-service",     // Required: Service name in traces
  apiServiceUrls: [/.+/g],         // Required: URLs to instrument
  options: {
    // Authentication (one required)
    proxy: "https://otel-collector",  // Recommended: OTEL collector URL
    apiKey: "hcaik_...",              // Alternative: Direct API key (less secure)

    // Custom instrumentation
    instrumentations: [],             // Additional OpenTelemetry instrumentations
    spanProcessors: [],               // Custom span processors

    // Use `false` to disable, or a function to customize the instrumentation.
    fetchInstrumentation: (config) => config,                // Customize fetch instrumentation
    documentLoadInstrumentation: (config) => config,         // Customize document load instrumentation

    // Disabled by default. Use `true` to enable with defaults, or a function to enable and customize.
    xmlHttpRequestInstrumentation: true,                     // Enable XHR instrumentation
    userInteractionInstrumentation: (config) => config,      // Enable and customize user interactions

    transformers: []                  // SDK-level configuration transformers
  }
}
```

### Setting Custom Attributes

```typescript
const honeycombClient = useHoneycombInstrumentationClient();

// Single attribute
honeycombClient.setGlobalSpanAttribute("app.user_id", "123");

// Multiple attributes
honeycombClient.setGlobalSpanAttributes({
  "app.user_id": "123",
  "app.organization_id": "456",
  "app.environment": "production"
});
```

### Custom Traces with OpenTelemetry

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

// Simple span
const span = tracer.startSpan("data-processing");
span.setAttribute("item.count", items.length);
// ... do work
span.end();

// With error handling
const span = tracer.startSpan("api-call");
try {
  const result = await fetchData();
  span.setAttribute("result.size", result.length);
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  span.recordException(error);
  throw error;
} finally {
  span.end();
}
```

### Fetch Request Hooks

```typescript
const honeycombClient = useHoneycombInstrumentationClient();

// Add hook at end of pipeline
honeycombClient.registerFetchRequestHook((requestSpan, request) => {
  if (request instanceof Request) {
    const moduleId = request.headers.get("x-module-id");
    if (moduleId) {
      requestSpan.setAttribute("app.module_id", moduleId);
    }
  }
});

// Add hook at start of pipeline (can return true to stop propagation)
honeycombClient.registerFetchRequestHookAtStart((requestSpan, request) => {
  if (request instanceof Request) {
    const moduleId = request.headers.get("x-module-id");
    if (moduleId) {
      requestSpan.setAttribute("app.module_id", moduleId);
      // Return true to prevent execution of subsequent hooks
      return true;
    }
  }
});
```

### Automatic Correlation

Honeycomb traces automatically include:

| Attribute | Source |
|---|---|
| `app.telemetry_id` | Current session telemetry ID |
| `app.device_id` | Device ID from wl-identity cookie |
| `app.logrocket_session_url` | LogRocket session URL (if enabled) |

---

## LogRocket Integration

### Purpose

LogRocket provides session replay for debugging frontend issues and understanding user experience.

### Default Features

| Feature | Description |
|---|---|
| Session replay | Video-like recording of user sessions |
| Console capture | Log messages (opt-in via LogRocketLogger) |
| Network monitoring | Request/response capture |
| DOM interactions | Click, scroll, input tracking |
| Issue surfacing | Galileo AI proactively surfaces issues |

### Configuration Options

```typescript
logRocket: {
  appId: "your-app-id",           // Required: LogRocket app ID
  options: {
    rootHostname: ".workleap.com",           // Cookie domain
    privateFieldNames: ["secret"],           // Additional private form fields
    privateQueryParameterNames: ["token"],   // Additional private URL params
    transformers: []                         // SDK-level configuration transformers
  }
}
```

### Privacy Controls

By default, all user-provided text inputs and content are sanitized. Use `data-public` to explicitly allow recording:

**HTML Attributes:**
- `data-public`: Explicitly allow recording of this element
- `data-private`: Block recording within a public area

```html
<!-- Content is recorded because of data-public -->
<div data-public>
  <p>This is recorded</p>
  <!-- This is NOT recorded -->
  <span data-private>Sensitive info</span>
</div>
```

### User Identification

```typescript
import LogRocket from "logrocket";
import { useLogRocketInstrumentationClient } from "@workleap/telemetry/react";

const client = useLogRocketInstrumentationClient();

// Create standard Workleap traits
const traits = client.createWorkleapPlatformDefaultUserTraits({
  userId: "6a5e6b06-0cac-44ee-8d2b-00b9419e7da9",
  organizationId: "e6bb30f8-0a00-4928-8943-1630895a3f14",
  organizationName: "Acme",
  isMigratedToWorkleap: true,
  isAdmin: false,
  isOrganizationCreator: false
});

// Identify user
LogRocket.identify(traits.userId, traits);
```

### Send Additional Traits

You can merge additional traits before sending them:

```typescript
const allTraits = {
  ...client.createWorkleapPlatformDefaultUserTraits({
    userId: "6a5e6b06-0cac-44ee-8d2b-00b9419e7da9",
    organizationId: "e6bb30f8-0a00-4928-8943-1630895a3f14",
    organizationName: "Acme",
    isMigratedToWorkleap: true,
    isOrganizationCreator: false,
    isAdmin: false
  }),
  "Additional Trait": "Trait Value"
};

LogRocket.identify(allTraits.userId, allTraits);
```

### Session URL Access

```typescript
import LogRocket from "logrocket";

// Host applications should use LogRocket.getSessionURL directly
LogRocket.getSessionURL((url) => {
  console.log("LogRocket session:", url);
});
```

### Automatic Correlation

LogRocket sessions automatically include:

| Property | Description |
|---|---|
| `Telemetry Id` | Current session telemetry ID |
| `Device Id` | Device ID from wl-identity cookie |

---

## Mixpanel Integration

### Purpose

Mixpanel provides product analytics for tracking user behavior and measuring feature adoption.

### Configuration Options

```typescript
mixpanel: {
  envOrTrackingApiBaseUrl: "production",  // Required: Environment or base URL
  options: {
    productId: "wlp",              // Optional: Product identifier
    trackingEndpoint: "/track"     // Optional: Custom tracking endpoint path
  }
}
```

**Environment Values:**
- `"production"` - Production tracking API
- `"staging"` - Staging tracking API
- `"development"` - Development tracking API
- `"local"` - Local tracking API
- `"msw"` - Mock Service Worker for testing
- Custom URL - Direct base URL

### Event Tracking

```typescript
const track = useMixpanelTrackingFunction();

// Standard event
track("ButtonClicked", {
  Trigger: "ChangePlan",
  Location: "Header"
});

// Link tracking (keeps page alive during navigation)
track("LinkClicked", { Link: "Pricing" }, { keepAlive: true });
```

**Important:** `keepAlive: true` is limited to 64 KiB body size. Use only for critical link tracking.

### Cross-Product Tracking

```typescript
// Track event for another product
const trackWov = useMixpanelTrackingFunction({ targetProductId: "wov" });

trackWov("FeatureUsed", { Feature: "Dashboard" });
```

### Global Properties

```typescript
const mixpanelClient = useMixpanelClient();

// Single property
mixpanelClient.setGlobalEventProperty("Plan", "premium");

// Multiple properties
mixpanelClient.setGlobalEventProperties({
  "User Id": "123",
  "Plan": "premium",
  "Team Size": 10
});
```

### Scoped Properties with MixpanelPropertiesProvider

```typescript
import { MixpanelPropertiesProvider } from "@workleap/telemetry/react";

// Define as a static object outside the component
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

### Automatic Correlation

Mixpanel events automatically include:

| Property | Description |
|---|---|
| `Telemetry Id` | Current session telemetry ID |
| `Device Id` | Device ID from wl-identity cookie |
| `LogRocket Session URL` | LogRocket session URL (if enabled) |

---

## Cross-Platform Correlation

### How Correlation Works

wl-telemetry automatically propagates two IDs across all platforms:

```
┌──────────────────────────────────────────────────────────┐
│                    TelemetryContext                       │
│                                                          │
│  Telemetry Id (per app load)  ──┬──> Honeycomb           │
│                                 ├──> LogRocket           │
│                                 └──> Mixpanel            │
│                                                          │
│  Device Id (from wl-identity)  ──┬──> Honeycomb          │
│                                  ├──> LogRocket          │
│                                  └──> Mixpanel           │
│                                                          │
│  LogRocket Session URL ─────────┬──> Honeycomb           │
│  (if LogRocket enabled)         └──> Mixpanel            │
└──────────────────────────────────────────────────────────┘
```

### Correlation Scenarios

**Scenario 1: Backend error traced to frontend**
1. Find error trace in Honeycomb with `app.telemetry_id`
2. Search LogRocket for same `Telemetry Id` in User Traits filter
3. Watch session replay to see user actions before error

**Scenario 2: User behavior analysis**
1. Find interesting event pattern in Mixpanel
2. Use `Telemetry Id` to find corresponding Honeycomb traces
3. Analyze performance impact of behavior

**Scenario 3: Device-level investigation**
1. User reports issue but session ended
2. Use `Device Id` to find all sessions from that device
3. Correlate across all platforms

### Accessing Correlation Values

**Important:** Do not create your own `TelemetryContext` instances. Correlation values are automatically managed by wl-telemetry and propagated to all platforms.

To verify correlation IDs are working:
- **Honeycomb**: Look for `app.telemetry_id` and `app.device_id` attributes in traces
- **LogRocket**: Check the "User Traits" filter for `Telemetry Id` and `Device Id`
- **Mixpanel**: Look for `Telemetry Id` and `Device Id` properties in events
