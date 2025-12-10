---
order: 100
toc:
    depth: 2-3
---

# initializeFireflyForStorybook

Create a runtime instance tailored for [Storybook](https://storybook.js.org/) and optionally register local modules. 

## Reference

```ts
const runtime = initializeFireflyForStorybook(options?: { localModules?, environmentVariables?, featureFlags? })
```

### Parameters

- `options`: An optional object literal of options:
    - `localModules`: An optional array of `ModuleRegisterFunction`.
    - `environmentVariables`: An optional object of environment variables.
    - `featureFlags`: An optional Map instance of feature flags.

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

```ts !#10
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

// This syntax with the nested arrays and "as const" is super important to get type safety when
// using the "withFeatureFlagsOverrideDecorator" decorator.
const featureFlags = new Map([
    ["show-characters", true]
] as const);

const runtime = initializeFireflyForStorybook({
    featureFlags
});
```


