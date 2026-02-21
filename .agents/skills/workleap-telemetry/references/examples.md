# wl-telemetry Usage Examples

## Table of Contents

1. [Full Application Setup](#full-application-setup)
2. [Storybook Setup](#storybook-setup)
3. [Unit Test Setup](#unit-test-setup)
4. [User Identification](#user-identification)
5. [Custom Honeycomb Traces](#custom-honeycomb-traces)
6. [Mixpanel Event Tracking](#mixpanel-event-tracking)
7. [Scoped Mixpanel Properties](#scoped-mixpanel-properties)
8. [Logging Configuration](#logging-configuration)
9. [Troubleshooting Setup](#troubleshooting-setup)

---

## Full Application Setup

### Basic Setup (All Platforms)

```typescript
// telemetry.ts
import { initializeTelemetry } from "@workleap/telemetry/react";

export const telemetryClient = initializeTelemetry("sg", {
  logRocket: {
    appId: "your-org/your-app"
  },
  honeycomb: {
    namespace: "your-team",
    serviceName: "your-app",
    apiServiceUrls: [/api\.yourcompany\.com/],
    options: {
      proxy: "https://otel-collector.yourcompany.com"
    }
  },
  mixpanel: {
    envOrTrackingApiBaseUrl: "production"
  }
});
```

```typescript
// App.tsx
import { TelemetryProvider } from "@workleap/telemetry/react";
import { telemetryClient } from "./telemetry";

export function App() {
  return (
    <TelemetryProvider client={telemetryClient}>
      <YourApplication />
    </TelemetryProvider>
  );
}
```

### Honeycomb Only

```typescript
const telemetryClient = initializeTelemetry("wlp", {
  honeycomb: {
    namespace: "your-team",
    serviceName: "your-app",
    apiServiceUrls: [/.+/g],
    options: {
      proxy: "https://otel-collector.yourcompany.com"
    }
  }
});
```

### LogRocket Only

```typescript
const telemetryClient = initializeTelemetry("sg", {
  logRocket: {
    appId: "your-org/your-app"
  }
});
```

### Mixpanel Only

```typescript
const telemetryClient = initializeTelemetry("wlp", {
  mixpanel: {
    envOrTrackingApiBaseUrl: "production"
  }
});
```

---

## Storybook Setup

### Storybook Decorator

```typescript
// withTelemetryProvider.tsx
import { NoopTelemetryClient, TelemetryProvider } from "@workleap/telemetry/react";
import type { Decorator } from "storybook-react-rsbuild";

const telemetryClient = new NoopTelemetryClient();

export const withTelemetryProvider: Decorator = (Story) => (
  <TelemetryProvider client={telemetryClient}>
    <Story />
  </TelemetryProvider>
);
```

### Global Setup

```typescript
// preview.ts
import { withTelemetryProvider } from "./withTelemetryProvider.tsx";

export const decorators = [withTelemetryProvider];
```

### Per-Story Override

```typescript
// MyComponent.stories.tsx
import { withTelemetryProvider } from "./withTelemetryProvider.tsx";
import { MyComponent } from "./MyComponent.tsx";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  decorators: [withTelemetryProvider]
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

---

## Unit Test Setup

### Jest/Vitest Setup

```typescript
// test-utils.tsx
import { NoopTelemetryClient, TelemetryProvider } from "@workleap/telemetry/react";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

const telemetryClient = new NoopTelemetryClient();

export function renderWithTelemetry(ui: ReactElement) {
  return render(
    <TelemetryProvider client={telemetryClient}>
      {ui}
    </TelemetryProvider>
  );
}
```

### Usage in Tests

```typescript
// MyComponent.test.tsx
import { renderWithTelemetry } from "./test-utils";
import { MyComponent } from "./MyComponent";

test("renders correctly", () => {
  const { getByText } = renderWithTelemetry(<MyComponent />);
  expect(getByText("Hello")).toBeInTheDocument();
});
```

---

## User Identification

### Workleap Platform User Identification

```typescript
import LogRocket from "logrocket";
import { useLogRocketInstrumentationClient } from "@workleap/telemetry/react";

function useIdentifyUser(user: User | null) {
  const logRocketClient = useLogRocketInstrumentationClient({ throwOnUndefined: false });

  useEffect(() => {
    if (!user || !logRocketClient) return;

    const traits = logRocketClient.createWorkleapPlatformDefaultUserTraits({
      userId: user.id,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      isMigratedToWorkleap: user.isMigrated,
      isAdmin: user.isAdmin,
      isOrganizationCreator: user.isCreator
    });

    LogRocket.identify(traits.userId, traits);
  }, [user, logRocketClient]);
}
```

### ShareGate User Identification

```typescript
import LogRocket from "logrocket";
import { useLogRocketInstrumentationClient } from "@workleap/telemetry/react";

function useIdentifyUser() {
  const logRocketClient = useLogRocketInstrumentationClient({ throwOnUndefined: false });

  useEffect(() => {
    if (!logRocketClient) return;

    const traits = logRocketClient.createShareGateDefaultUserTraits({
      shareGateAccountId: "cd7fb5ca-f13d-420f-9a87-637b3419d242",
      microsoftUserId: "e9bb1688-a68b-4235-b514-95a59a7bf8bc",
      microsoftTenantId: "86bea6e5-5dbb-43c9-93a4-b10bf91cc6db",
      workspaceId: "225e6494-c008-4086-ac80-3770aa47085b"
    });

    LogRocket.identify(traits.shareGateAccountId, traits);
  }, [logRocketClient]);
}
```

### With Honeycomb Attributes

```typescript
import LogRocket from "logrocket";
import {
  useLogRocketInstrumentationClient,
  useHoneycombInstrumentationClient
} from "@workleap/telemetry/react";

function useIdentifyUser(user: User | null) {
  const logRocketClient = useLogRocketInstrumentationClient({ throwOnUndefined: false });
  const honeycombClient = useHoneycombInstrumentationClient({ throwOnUndefined: false });

  useEffect(() => {
    if (!user) return;

    // LogRocket identification
    if (logRocketClient) {
      const traits = logRocketClient.createWorkleapPlatformDefaultUserTraits({
        userId: user.id,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        isMigratedToWorkleap: user.isMigrated,
        isAdmin: user.isAdmin,
        isOrganizationCreator: user.isCreator
      });
      LogRocket.identify(traits.userId, traits);
    }

    // Honeycomb attributes
    if (honeycombClient) {
      honeycombClient.setGlobalSpanAttributes({
        "app.user_id": user.id,
        "app.organization_id": user.organizationId,
        "app.is_admin": user.isAdmin
      });
    }
  }, [user, logRocketClient, honeycombClient]);
}
```

### Send Additional Traits

```typescript
import LogRocket from "logrocket";
import { useLogRocketInstrumentationClient } from "@workleap/telemetry/react";

const client = useLogRocketInstrumentationClient();

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

---

## Custom Honeycomb Traces

### Basic Custom Span

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

function processData(items: Item[]) {
  const span = tracer.startSpan("process-data");
  span.setAttribute("items.count", items.length);

  try {
    // ... processing logic
    span.setAttribute("result.status", "success");
  } catch (error) {
    span.setAttribute("result.status", "error");
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Async Operation Tracing

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

async function fetchUserData(userId: string) {
  const span = tracer.startSpan("fetch-user-data");
  span.setAttribute("user.id", userId);

  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();

    span.setAttribute("response.status", response.status);
    span.setAttribute("user.found", !!data);
    span.setStatus({ code: SpanStatusCode.OK });

    return data;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### React Component with Tracing

```typescript
import { useEffect } from "react";
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

export function Page() {
  useEffect(() => {
    const span = tracer.startSpan("page-load");
    span.end();
  }, []);

  return <div>Hello from a page!</div>;
}
```

---

## Mixpanel Event Tracking

### Basic Event Tracking

```typescript
import { useMixpanelTrackingFunction } from "@workleap/telemetry/react";

function FeatureButton() {
  const track = useMixpanelTrackingFunction();

  const handleClick = () => {
    track("FeatureClicked", {
      Feature: "Premium Upgrade",
      Location: "Header"
    });
  };

  return <button onClick={handleClick}>Upgrade</button>;
}
```

### Link Tracking with Keepalive

```typescript
import { useMixpanelTrackingFunction } from "@workleap/telemetry/react";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const track = useMixpanelTrackingFunction();

  const handleClick = () => {
    // keepAlive ensures event is sent before navigation
    track("ExternalLinkClicked", { URL: href }, { keepAlive: true });
  };

  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
```

### Cross-Product Tracking

```typescript
import { useMixpanelTrackingFunction } from "@workleap/telemetry/react";

function SharedComponent() {
  // Track to current product
  const track = useMixpanelTrackingFunction();

  // Track to specific product
  const trackToWov = useMixpanelTrackingFunction({ targetProductId: "wov" });

  const handleAction = () => {
    // Local product event
    track("ActionTaken", { Action: "Save" });

    // Cross-product event
    trackToWov("IntegrationUsed", { Source: "wlp" });
  };

  return <button onClick={handleAction}>Save</button>;
}
```

### Setting Global Properties

```typescript
import { useMixpanelClient } from "@workleap/telemetry/react";
import { useEffect } from "react";

function UserContextProvider({ user, children }) {
  const mixpanelClient = useMixpanelClient({ throwOnUndefined: false });

  useEffect(() => {
    if (!user || !mixpanelClient) return;

    mixpanelClient.setGlobalEventProperties({
      "User Id": user.id,
      "Plan": user.plan,
      "Team Size": user.teamSize
    });
  }, [user, mixpanelClient]);

  return children;
}
```

---

## Scoped Mixpanel Properties

### Using MixpanelPropertiesProvider

```typescript
import { MixpanelPropertiesProvider, useMixpanelTrackingFunction } from "@workleap/telemetry/react";

// Define as a static object outside the component
const MixpanelProperties = {
  section: "User Form"
};

function NestedComponent() {
  const track = useMixpanelTrackingFunction();

  // Events tracked here automatically include { section: "User Form" }
  const handleClick = () => {
    track("ButtonClicked", { Trigger: "Submit" });
  };

  return <button onClick={handleClick}>Submit</button>;
}

function App() {
  return (
    <MixpanelPropertiesProvider value={MixpanelProperties}>
      <NestedComponent />
    </MixpanelPropertiesProvider>
  );
}
```

---

## Logging Configuration

### Development vs Production Logging

```typescript
import { initializeTelemetry, LogRocketLogger } from "@workleap/telemetry/react";
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

const isDev = process.env.NODE_ENV === "development";

const telemetryClient = initializeTelemetry("sg", {
  // ... platform configs
  verbose: isDev,
  loggers: [
    isDev
      ? new BrowserConsoleLogger()
      : new LogRocketLogger({ logLevel: LogLevel.information })
  ]
});
```

### LogRocket Logger Usage

```typescript
import { LogRocketLogger } from "@workleap/telemetry/react";

const logger = new LogRocketLogger();

// Simple messages
logger.debug("Debug info");
logger.information("User logged in");
logger.warning("Slow response detected");
logger.error("API call failed");
logger.critical("Application crash");

// Structured logging
logger
  .withText("Processing order")
  .withObject({ orderId: "123", items: 5 })
  .information();

// With error
logger
  .withText("Failed to save")
  .withError(new Error("Network timeout"))
  .error();
```

### Scoped Logging

```typescript
import { LogRocketLogger } from "@workleap/telemetry/react";

const logger = new LogRocketLogger();

function processCheckout(order: Order) {
  const scope = logger.startScope("Checkout Process");

  scope.information("Starting checkout");
  scope.withObject(order).debug();

  // ... processing

  scope.information("Checkout complete");
  scope.end();

  // Or dismiss a scope to prevent output
  // scope.end({ dismiss: true });
}
```

---

## Troubleshooting Setup

### Enable Verbose Mode

```typescript
const telemetryClient = initializeTelemetry("wlp", {
  // ... platform configs
  verbose: true
});
```

### Debug Production Issues

```typescript
import { LogRocketLogger } from "@workleap/telemetry/react";

const telemetryClient = initializeTelemetry("sg", {
  // ... platform configs
  verbose: true,
  loggers: [new LogRocketLogger()]  // No log level = all levels captured
});
```

### Conditional Debug Mode

```typescript
import { LogRocketLogger } from "@workleap/telemetry/react";
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

// Enable debug mode via URL parameter: ?debug=telemetry
const urlParams = new URLSearchParams(window.location.search);
const debugTelemetry = urlParams.get("debug") === "telemetry";

const telemetryClient = initializeTelemetry("wlp", {
  // ... platform configs
  verbose: debugTelemetry,
  loggers: debugTelemetry
    ? [new BrowserConsoleLogger()]
    : [new LogRocketLogger({ logLevel: LogLevel.warning })]
});
```

### Verify Correlation IDs

**Important:** Do not create your own `TelemetryContext` instances. Correlation values are automatically managed by wl-telemetry.

To verify correlation IDs are being captured correctly:
- **Honeycomb**: Navigate to the Query page, run a query, and check for `app.telemetry_id` and `app.device_id` attributes in traces
- **LogRocket**: Go to Session Replay, open User Traits filter, and look for `Telemetry Id` and `Device Id`
- **Mixpanel**: Navigate to Events page, select an event, and check for `Telemetry Id` and `Device Id` properties
