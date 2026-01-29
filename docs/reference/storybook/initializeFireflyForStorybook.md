---
order: 100
toc:
    depth: 2-3
---

# initializeFireflyForStorybook

Create a runtime instance tailored for [Storybook](https://storybook.js.org/) and optionally register local modules. 

## Reference

```ts
const runtime = initializeFireflyForStorybook(options?: { localModules?, environmentVariables?, featureFlags?, launchDarklyClient?, loggers?, useMsw? })
```

### Parameters

- `options`: An optional object literal of options:
    - `localModules`: An optional array of `ModuleRegisterFunction`.
    - `environmentVariables`: An optional object of environment variables.
    - `featureFlags`: An optional Map instance of feature flags.
    - `launchDarklyClient`: An optional LaunchDarkly client to override the default client.
    - `loggers`: An optional array of logger instances.
    - `useMsw`: An optional `boolean` value indicating whether or not to create the runtime with [Mock Service Work](https://mswjs.io/) (MSW) support. Default is `true`,
### Returns

A `StorybookRuntime` instance.

## Usage

### Initialize with local modules

```ts !#3-5
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = initializeFireflyForStorybook({
    localModules: [...]
});
```

### Initialize with environment variables

```ts !#3-7
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = initializeFireflyForStorybook({
    environmentVariables: {
        "foo": "bar"
    }
});
```

### Initialize with feature flags

```ts !#4-6
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = initializeFireflyForStorybook({
    featureFlags: {
        "show-characters": true
    }
});
```

### Initialize with a LaunchDarkly client

```ts !#10
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const launchDarklyClient = new InMemoryLaunchDarklyClient(featureFlags);

const runtime = initializeFireflyForStorybook({
    featureFlags: {
        "show-characters": true
    },
    launchDarklyClient
});
```

### Initialize without MSW support

```ts !#6
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const launchDarklyClient = new InMemoryLaunchDarklyClient(featureFlags);

const runtime = initializeFireflyForStorybook({
    useMsw: false
});
```




