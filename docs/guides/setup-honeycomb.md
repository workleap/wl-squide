---
order: 800
---

# Setup Honeycomb

!!!warning
Before going forward with this guide, make sure that you migrated to [v13](../updating/migrate-to-firefly-v13.0.md).
!!!

To monitor application performance, Workleap has adopted [Honeycomb](https://www.honeycomb.io/), a tool that helps teams manage and analyze telemetry data from distributed systems. Built on OpenTelemetry, Honeycomb provides a [robust API](https://open-telemetry.github.io/opentelemetry-js/) for tracking frontend telemetry.

Squide can integrate with a host application's Honeycomb setup that uses [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) v5 or higher. When integrated, the performance of Squide initialization is automatically tracked in Honeycomb, no additional setup is required from the host application.

The only requirement is that the **Honeycomb instrumentation** in the host application must be **registered before initializing Squide**. When Honeycomb instrumentation is not registered before initializing Squide, performance traces will still be send to Honeycomb, but in a "degraded mode".

## Setup the host application

Let's start by configuring the host application.

First, open a terminal at the root of the host application and install the following packages:

```bash
pnpm add @workleap/honeycomb @opentelemetry/api
```

## Register instrumentation

Then, update the host application bootstrapping code to register Honeycomb instrumentation:

```tsx !#8-11 host/src/index.tsx
import { ConsoleLogger, FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@workleap/honeycomb";
import { register as registerMyLocalModule } from "@sample/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Register Honeycomb instrumentation BEFORE initializing Squide.
registerHoneycombInstrumentation("sample", "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    loggers: [x => new ConsoleLogger(x)]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

!!!tip
For additional information about this Honeycomb instrumentation setup, refer to the `@workleap/honeycomb` library [documentation](https://workleap.github.io/wl-honeycomb-web).
!!!

!!!warning
Avoid using `/.+/g,` in production, as it could expose customer data to third parties. Instead, ensure you specify values that accurately matches your application's backend URLs.
!!!

!!!warning
We recommend using an [OpenTelemetry collector](https://docs.honeycomb.io/send-data/opentelemetry/collector/) over an ingestion [API key](https://docs.honeycomb.io/get-started/configure/environments/manage-api-keys/#create-api-key), as API keys can expose Workleap to potential attacks. To use a collector, set the `proxy` option with your collector's proxy address.
!!!

With instrumentation in place, a few traces are now available :point_down:

### Bootstrapping flow

The performance of an application bootstrapping flow can now be monitored:

:::align-image-left
![Bootstrapping flow performance](../static/honeycomb-bootstrapping.png)
:::

### Deferred registration update

When a deferred registration is updated, the performance of the operation can be monitored:

:::align-image-left
![Deferred registration update performance](../static/honeycomb-deferred-registration-update.png)
:::

### Fetch requests

Individual fetch request performance can be monitored from end to end:

:::align-image-left
![Fetch instrumentation](../static/honeycomb-http-get.png)
:::

### Document load

The loading performance of the DOM can be monitored:

:::align-image-left
![Document load instrumentation](../static/honeycomb-document-load.png)
:::

### Unmanaged error

When an unmanaged error occurs, it's automatically recorded:

:::align-image-left
![Recorded error](../static/honeycomb-failing-http-request.png)
:::

### Real User Monitoring (RUM)

The default instrumentation will automatically track the appropriate metrics to display RUM information:

:::align-image-left
![Largest Contentful Paint](../static/honeycomb-lcp.png){width=536 height=378}
:::
:::align-image-left
![Cumulative Layout Shift](../static/honeycomb-cls.png){width=536 height=378}
:::
:::align-image-left
![Interaction to Next Paint](../static/honeycomb-inp.png){width=532 height=358}
:::

## Set custom user attributes

Most application needs to set custom attributes on traces about the current user environment. To help with that, [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) expose the [setGlobalSpanAttributes](https://workleap.github.io/wl-honeycomb-web/reference/setglobalspanattributes/) function.

Update your host application to include the `setGlobalSpanAttributes` function:

```tsx !#33-40 host/src/App.tsx
import { AppRouter, useProtectedDataQueries, useIsBootstrapping } from "@squide/firefly";
import { setGlobalSpanAttributes } from "@workleap/honeycomb";
import { useEffect } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SessionManagerContext, ApiError, isApiError, type Session } from "@sample/shared";
import { useSessionManagerInstance } from "./sessionManager.ts";

function BootstrappingRoute() {
    const [session] = useProtectedDataQueries([
        {
            queryKey: ["/api/session"],
            queryFn: async () => {
                const response = await fetch("/api/session");

                if (!response.ok) {
                    throw new ApiError(response.status, response.statusText);
                }

                const data = await response.json();

                const result: Session = {
                    user: {
                        id: data.id,
                    }
                };

                return result;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    useEffect(() => {
        if (session) {
            // Update telemetry global attributes.
            setGlobalSpanAttributes({
                "app.user_id": session.user.id
            });
        }
    }, [session])

    const sessionManager = useSessionManagerInstance(session!);

    if (useIsBootstrapping()) {
        return <div>Loading...</div>;
    }

    return (
        <SessionManagerContext.Provider value={sessionManager}>
            <Outlet />
        </SessionManagerContext.Provider>
    );
}

export function App() {
    return (
        <AppRouter waitForProtectedData>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </AppRouter>
    );
}
```

Now, every trace recorded **after** the session initialization will include the custom attributes `app.user_id`:

:::align-image-left
![Custom attributes](../static/honeycomb-custom-attributes.png){width=204 height=161}
:::

## Custom traces

Applications are expected to use the [OpenTelemetry API](https://docs.honeycomb.io/send-data/javascript-browser/honeycomb-distribution/#add-custom-instrumentation) to send custom traces to Honeycomb:

```tsx host/src/Page.tsx
import { useEffect } from "react";
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-tracer");

export function Page() {
    useEffect(() => {
        // OK, this is a pretty bad example.
        const span = tracer.startSpan("my-span");
        span.end();
    }, []);

    return (
        <div>Hello from a page!</div>
    );
}
```

## Try it :rocket:

Start the application in a development environment using the `dev` script. Render a page, then navigate to your Honeycomb instance. Go to the `Query` page and type `root.name = squide-bootstrapping` into the `Where` input. Run the query, select the `Traces` tab at the bottom of the page and view the detail of a trace. You should view the performance of your application bootstrapping flow.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Ensure that `@workleap/honeycomb` instrumentation has been registered before executing the [initializeFirefly](../reference/registration/initializeFirefly.md) function.
- Set `@workleap/honeycomb` [registerHoneycombInstrumentation](https://workleap.github.io/wl-honeycomb-web/reference/registerhoneycombinstrumentation/) function [debug](https://workleap.github.io/wl-honeycomb-web/reference/registerhoneycombinstrumentation/#debug) option to `true`.
- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll see a log entry for every for each dispatched event, along with multiple console outputs from Honeycomb's SDK. Squide's bootstrapping instrumentation listens to events to send Honeycomb traces. Most events should match an Honeycomb trace and vice versa.
    - `[squide] Dispatching event "squide-local-modules-registration-completed"`
    - `[squide] Dispatching event "squide-remote-modules-registration-completed"`
    - `[squide] Dispatching event "squide-public-data-fetch-started"`
    - `[squide] Dispatching event "squide-public-data-ready"`
    - `@honeycombio/opentelemetry-web: Honeycomb link: ...`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
