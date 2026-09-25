---
order: 100
toc:
    depth: 2-3
---

# initializeFireflyForStorybook

Create a runtime instance tailored for [Storybook](https://storybook.js.org/) and optionally register local modules. 

## Reference

```ts
const runtime = initializeFireflyForStorybook<TData = unknown>(options?: { localModules?, environmentVariables?, featureFlags?, launchDarklyClient?, loggers?, useMsw? })
```

### Type parameters

- `TData`: An optional type describing the data passed to deferred registration functions returned by `localModules`. Defaults to `unknown`.

### Parameters

- `options`: An optional object literal of options:
    - `localModules`: An optional array of `ModuleRegisterFunction<FireflyRuntime, unknown, TData>`.
    - `environmentVariables`: An optional object of environment variables.
    - `featureFlags`: An optional Map instance of feature flags.
    - `launchDarklyClient`: An optional LaunchDarkly client to override the default client.
    - `loggers`: An optional array of logger instances.
    - `useMsw`: An optional `boolean` value indicating whether or not to create the runtime with [Mock Service Work](https://mswjs.io/) (MSW) support. Default is `true`.
    - `additionalPlugins`: An optional array with additional plugins to be registered with the runtime.
### Returns

A `Promise` resolving to a `StorybookRuntime` instance.

## Usage

### Initialize with local modules

```ts !#3-5
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";

const runtime = initializeFireflyForStorybook({
    localModules: [...]
});
```

### Initialize with environment variables

```ts !#3-7
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";

const runtime = initializeFireflyForStorybook({
    environmentVariables: {
        "foo": "bar"
    }
});
```

### Initialize with feature flags

```ts !#4-6
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";

const runtime = initializeFireflyForStorybook({
    featureFlags: {
        "show-characters": true
    }
});
```

### Initialize with a LaunchDarkly client

```ts !#10
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";
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

```ts !#4
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";

const runtime = initializeFireflyForStorybook({
    useMsw: false
});
```

### Initialize with i18next

```ts !#5
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";
import { i18nextPlugin } from "@squide/i18next";

const runtime = initializeFireflyForStorybook({
    additionalPlugins: [x => new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language")]
});
```

When the modules register [lazy](../i18next/i18nextPlugin.md#lazy-load-resources-per-language) `i18next` instances, or when a story renders in a language other than the detected one, await the [changeLanguage](../i18next/i18nextPlugin.md#change-the-current-language) method of the plugin from a Storybook [loader](https://storybook.js.org/docs/writing-stories/loaders): the [FireflyDecorator](./FireflyDecorator.md) renders a story as soon as the modules are registered, without waiting for the resources. Called with the current language, `changeLanguage` waits for the pending resources loads without notifying anyone. A lazy instance requires the user language to be detected, and must be registered from the `localModules` register functions because `initializeFireflyForStorybook` marks the modules as registered before it returns:

```ts !#21-25
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-storybook";
import { getI18nextPlugin, i18nextPlugin } from "@squide/i18next";

const runtime = await initializeFireflyForStorybook({
    // The module creates and registers the i18next instance.
    localModules: [registerModule],
    additionalPlugins: [x => {
        const plugin = new i18nextPlugin(x, ["en-US", "fr-CA"], "en-US", "language");
        plugin.detectUserLanguage();

        return plugin;
    }]
});

const meta = {
    decorators: [
        withFireflyDecorator(runtime)
    ],
    // The resources of the language are loaded before the story renders. Loaders run before decorators,
    // so a snapshot is never taken while the resources are still loading, which a decorator effect
    // couldn't guarantee.
    loaders: [
        async () => {
            await getI18nextPlugin(runtime).changeLanguage("fr-CA");
        }
    ]
};
```

### Initialize with typed deferred registration data

Pass a `TData` type argument so that the data forwarded to deferred registration functions is strongly typed.

```ts !#4-6,8,16
import { initializeFireflyForStorybook } from "@squide/firefly-storybook";
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

interface DeferredData {
    subscription: { tier: "free" | "pro" | "enterprise" };
}

const registerModule: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredData> = runtime => {
    return (runtime, data, operation) => {
        if (data.subscription.tier === "enterprise") {
            // Register routes/navigation only available to enterprise tenants.
        }
    };
};

const runtime = initializeFireflyForStorybook<DeferredData>({
    localModules: [registerModule]
});
```




