---
order: 890
label: Migrate to firefly v15.0
toc:
    depth: 2-3
---

# Migrate to firefly v15.0

!!!warning
If you are migrating from `v8.*`, follow the [Migrate from v8.* to v15.0](./migrate-from-v8-to-v15.0.md) guide.
!!!

This major version changes how Squide integrates with [Honeycomb](https://www.honeycomb.io/). In previous versions, the Honeycomb integration depended on global variables registered by the [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb) package. Starting with this version, Squide integrates with Honeycomb only when it is initialized with a [HoneycombInstrumentationClient](https://workleap.github.io/wl-telemetry/reference/telemetry/honeycombinstrumentationclient/) instance.

The following example demonstrates how to integrate Squide with Honeycomb using the [@workleap/telemetry](https://www.npmjs.com/package/@workleap/telemetry) package. However, you can also integrate Honeycomb with the standalone `@workleap/honeycomb` package.

Before:

```tsx host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@workleap/honeycomb";
import { register as registerMyLocalModule } from "@sample/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

registerHoneycombInstrumentation("sample", "my-app", [/.+/g,], {
    proxy: "https://sample-proxy"
});

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

Now:

```tsx !#8-17,21 host/src/index.tsx
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { initializeTelemetry } from "@workleap/telemetry/react";
import { register as registerMyLocalModule } from "@sample/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const telemetryClient = initializeTelemetry({
    honeycomb: {
        namespace: "sample",
        serviceName: "squide-sample",
        apiServiceUrls: [/.+/g,],
        options: {
            proxy: "https://my-proxy.com"
        }
    }
});

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    honeycombInstrumentationClient: telemetryClient.honeycomb
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

