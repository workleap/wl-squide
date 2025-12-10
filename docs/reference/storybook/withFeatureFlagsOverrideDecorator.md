---
order: 70
toc:
    depth: 2-3
---

# withFeatureFlagsOverrideDecorator

Create a `Decorator` function that overrides the initial feature flag values while the story renders. Once rendering is complete, the original flag values are automatically restored.

## Reference

```ts
const decorator = withFeatureFlagsOverrideDecorator(featureFlags, overrides)
```

### Parameters

- `featureFlags`: The Map instance of feature flags that has been provided to the [initializeFireflyForStorybook](./initializeFireflyForStorybook.md#initialize-with-feature-flags) function.
- `overrides`: An object of feature flag overrides.

### Returns

A `Decorator` function.

## Usage

```tsx !#34
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

// This syntax with the nested arrays and "as const" is super important to get type safety with
// the "withFeatureFlagsOverrideDecorator" decorator.
const featureFlags = new Map([
    ["show-characters", true]
] as const);

const fireflyRuntime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    featureFlags
});

const meta = {
    title: "Page",
    component: Page,
    decorators: [
        withFireflyDecorator(fireflyRuntime)
    ],
    parameters: {
        msw: {
            handlers: [
                ...fireflyRuntime.requestHandlers
            ]
        }
    }
} satisfies Meta<typeof Page>;

export const Default = {
    decorators: [
        withFeatureFlagsOverrideDecorator(featureFlags, { "show-characters": false })
    ]
} satisfies Story;
```
