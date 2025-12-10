---
order: 390
label: Use feature flags
---

# Use feature flags

To use feature flags, start by following the [setup LaunchDarkly](../integrations/setup-launch-darkly.md) integration guide to create and initialize a LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) instance. Once the setup is complete, the examples below cover the most common use cases.

For more details, refer to the [reference](../reference/launch-darkly/LaunchDarklyPlugin.md) documentation.

## Evaluate a feature flag in bootstrapping code

Once the LaunchDarkly SDK client is ready, feature flags can be evaluated in the bootstrapping code. To faciliate the evaluation of feature flags in non-React code, Squide offers a [getFeatureFlag](../reference/launch-darkly/getFeatureFlag.md) function:

```ts !#4
import { getFeatureFlag } from "@squide/firefly";

// If the `foo` feature flag is not available, `true` will be returned.
const value = getFeatureFlag(launchDarklyClient, "foo", true);
```

## Evaluate a feature flag in React code

To evaluate a feature flag in React, use the [useFeatureFlag](../reference/launch-darkly/useFeatureFlag.md) hook:

```ts !#4
import { useFeatureFlag } from "@squide/firefly";

// If the `foo` feature flag is not available, `true` will be returned.
const value = useFeatureFlag("foo", true);
```

## Register a conditionnal navigation item

To register a navigation item based on feature flags, refer to the [register deferred navigation items](./register-deferred-nav-items.md) guide.

## Setup the typings

Before evaluating feature flags, modules must [augment](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) the [FeatureFlags](../reference/launch-darkly/FeatureFlags.md) interface with the feature flags they intend to evaluate to ensure type safety and autocompletion.

First, create a types folder in the project:

``` !#7-8
project
├── src
├────── register.tsx
├────── Page.tsx
├────── index.tsx
├────── App.tsx
├── types
├────── feature-flags.d.ts
```

Then create an `feature-flags.d.ts` file:

```ts !#6 project/types/feature-flags.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface FeatureFlags {
        // In the example above, the module only intends to evaliate the `foo` feature flag.
        foo: boolean;
    }
}
```

Finally, update the project `tsconfig.json` to include the `types` folder:

```json !#5-7 project/tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
        "types": [
            "./types/feature-flags.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```

If any other project using those environment variables must also reference the project's `feature-flags.d.ts` file:

```json !#5-7 project/tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
        "types": [
            "../another-project/types/feature-flags.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```

## Setup with tests

TBD

## Setup with Storybook

To set up [Storybook](https://storybook.js.org/docs) stories with feature flags, refer to the [setup Storybook](../integrations/setup-storybook.md#setup-feature-flags) integration guide.


