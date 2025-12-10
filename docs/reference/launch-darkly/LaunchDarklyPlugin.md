---
order: 200
toc:
    depth: 2-3
---

# LaunchDarklyPlugin

A plugin to faciliate the usage of [LaunchDarkly](https://launchdarkly.com/) feature flags in a modular application.

## Reference

```ts
const plugin = new LaunchDarklyPlugin(runtime, launchDarklyClient, { options?: { featureFlagSetSnapshot? } })
```

### Parameters

- `runtime`: A runtime instance.
- `launchDarklyClient`: A LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) instance that is [ready](https://launchdarkly.com/docs/sdk/client-side/javascript#determine-when-the-client-is-ready).
- `options`: An optional object literal of options:
    - `featureFlagSetSnapshot`: An optionnal [FeatureFlagSetSnapshot](./FeatureFlagSetSnapshot.md) instance.

## Usage

Before creating the plugin instance, initialize the LaunchDarkly client with [streaming](https://launchdarkly.github.io/js-client-sdk/interfaces/LDOptions.html#streaming) enabled, then wait until the client [is ready](https://launchdarkly.com/docs/sdk/client-side/javascript#determine-when-the-client-is-ready).

```ts !#10,14,17
import { FireflyRuntime, LaunchDarklyPlugin } from "@squide/firefly";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";

const launchDarklyClient = initializeLaunchDarkly("123", {
    kind: "user",
    anonymous: true
}, {
    // It's important to use the stream mode to receive feature flags
    // updates in real time.
    stream: true
});

// Always initialize the client before creating the plugin instance.
await launchDarklyClient.waitForInitialization(5);

const runtime = new FireflyRuntime({
    plugins: [x => new LaunchDarklyPlugin(x, launchDarklyClient)]
});
```


