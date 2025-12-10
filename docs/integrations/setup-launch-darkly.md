---
order: 486
label: Setup LaunchDarkly
---

# Setup LaunchDarkly

Squide integrates with [LaunchDarkly](https://launchdarkly.com/) to attach feature flags to the [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance and automatically update [deferred registrations](../essentials/register-deferred-nav-items.md) whenever a flag value changes.

## Initialize the client

To setup LaunchDarkly, first refer to the [create an host application](../introduction/create-host.md) guide as a starting point and update the host application bootstrapping code to create and initialize a LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) instance:

```tsx !#7-14,18,25
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const launchDarklyClient = initializeLaunchDarkly("123", {
    kind: "user",
    anonymous: true
}, {
    // It's important to use the stream mode to receive feature flags
    // updates in real time.
    stream: true
});

try {
    // Always initialize the client before creating the plugin instance.
    await launchDarklyClient.waitForInitialization(5);
} catch (error: unknown) {
    // Failed to initialize LaunchDarkly...
}

const runtime = initializeFirefly({
    localModules: [registerHost],
    launchDarklyClient
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

!!!tip
To receive real-time feature flag updates, initialize the LaunchDarkly client with [streaming](https://launchdarkly.github.io/js-client-sdk/interfaces/LDOptions.html#streaming) enabled. When a flag value changes, Squide automatically updates [deferred registrations](../essentials/register-deferred-nav-items.md), keeping conditional navigation items in sync with the feature flags.
!!!

!!!warning
[initializeFirefly](../reference/registration/initializeFirefly.md) expects the LaunchDarkly SDK client to be initialized before it's called.
!!!

## Retrieve a feature flag

Next, follow the [use feature flags](../essentials/use-feature-flags.md) essential page to add feature flags to your application.

## Try it :rocket:

Start the application in a development environment using the dev script, then navigate to a page that uses a feature flag. In [LaunchDarkly](https://app.launchdarkly.com/), toggle the flag value. The page should update and reflect the new value each time the flag is toggled.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Set the [initializeTelemetry](https://workleap.github.io/wl-telemetry/reference/telemetry/initializetelemetry/) function `verbose` option to `true`.
- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console. You'll see a log entry everytime a feature flag is updated, along with console outputs from LaunchDarkly SDK client.
    - `[LaunchDarkly] LaunchDarkly client initialized`
    - `[LaunchDarkly] Opening stream connection to:`
    - `[squide] Dispatching event "squide-feature-flags-updated"`
    - `[squide] Feature flags has been updated to:`
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/endpoints).
- Refer to the [troubleshooting](../troubleshooting.md) page.
