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

// If the `enable-mixpanel` feature flag is not available, `true` will be returned.
const value = getFeatureFlag(launchDarklyClient, "enable-mixpanel", true);
```

## Evaluate a feature flag in React code

To evaluate a feature flag in React, use the [useFeatureFlag](../reference/launch-darkly/useFeatureFlag.md) hook:

```ts !#4
import { useFeatureFlag } from "@squide/firefly";

// If the `show-characters` feature flag is not available, `true` will be returned.
const value = useFeatureFlag("show-characters", true);
```

## Register a conditionnal navigation item

To register a navigation item based on feature flags, refer to the [register deferred navigation items](./register-deferred-nav-items.md#feature-flags) guide.

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
        // In the example above, the module only intends to evaliate the `show-characters` feature flag.
        "show-characters": boolean;
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

Once configured, all feature flag hooks and functions are fully typed and support auto-completion:

:::align-image-left
![Auto-completion example](../static/feature-flags-typings.png){width=837}
:::

## Setup with tests

If the code under test uses environment variables, the `FireflyRuntime` instance can be used to mock these variables.

Considering the following page:

```tsx !#4 ./src/Page.tsx
import { useFeatureFlag } from "@squide/firefly";

export function Page() {
    const showCharacters = useFeatureFlag("show-characters", true);

    return (
        <>
            <h1>Page!<h1>
            {showCharacters && (
                <ul data-testid="character-list">
                    <li>Maren Holt</li>
                    <li>Theo Calder</li>
                    <li>Inez Navarro</li>
                </ul>
            )};
        </>
    );
}
```

The following unit test can be written to mock the value of `show-characters` and test the ouput of the `createTelemetryClient` function:

```tsx !#12,15,19,21 ./tests/createTelemetryClient.test.tsx
import { FireflyProvider, FireflyRuntime, LaunchDarklyPlugin, InMemoryLaunchDarklyClient } from "@squide/firefly";
import {render, screen} from "@testing-library/react";
import type { ReactNode } from "react";
import { Page } from "./src/Page.tsx";
import "@testing-library/jest-dom";

test("when the \"show-characters\" feature flag is off, do not render the character list", () => {
    const featureFlags = new Map([
        ["show-characters", false]
    ] as const);

    const launchDarklyClient = new InMemoryLaunchDarklyClient(featureFlags);

    const runtime = new FireflyRuntime({
        plugins: [x => new LaunchDarklyPlugin(x, launchDarklyClient)]
    });

    render(
        <FireflyProvider runtime={runtime}>
            <Page />
        </FireflyProvider>
    );

    expect(screen.queryByTestId("character-list")).not.toBeInTheDocument();
});
```

## Setup with Storybook

To set up [Storybook](https://storybook.js.org/docs) stories with feature flags, refer to the [setup Storybook](../integrations/setup-storybook.md#setup-feature-flags) integration guide.

## Use fake clients

To support a variety of development scenarios, "fake" implementations of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) are available. To simulate a LaunchDarkly environment, use either the [InMemoryLaunchDarklyClient](../reference/launch-darkly/InMemoryLaunchDarklyClient.md) or the [LocalStorageLaunchDarklyClient](../reference/launch-darkly/LocalStorageLaunchDarklyClient.md).

### Toggle feature flags

Both fake implementations support toggling feature flags. To do so, first ensure that the client is an editable implementation by using the [isEditableLaunchDarklyClient](../reference/launch-darkly/isEditableLaunchDarklyClient.md) utility function. Then, call the `setFeatureFlags` method of the editable client to update the feature flag values:

```ts !#10-13
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = new Map([
    ["show-characters", true],
    ["render-summary", true]
] as const);

const client = new InMemoryLaunchDarklyClient(featureFlags);

client.setFeatureFlags({
    "show-characters": true,
    "render-summary": false
});
```

