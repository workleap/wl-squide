---
order: 70
toc:
    depth: 2-3
---

# withFeatureFlagsOverrideDecorator

Create a `Decorator` function that overrides the initial feature flag values while the story renders. Once rendering is complete, the original flag values are automatically restored.

## Reference

```ts
const decorator = withFeatureFlagsOverrideDecorator(overrides)
```

### Parameters

- `overrides`: An object containing feature flag value overrides.

### Returns

A `Decorator` function.

## Usage

```tsx !#30
import { initializeFireflyForStorybook, withFireflyDecorator, withFeatureFlagsOverrideDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const fireflyRuntime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    featureFlags: {
        "render-summary": true
    }
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
        withFeatureFlagsOverrideDecorator({ "render-summary": false })
    ]
} satisfies Story;
```
