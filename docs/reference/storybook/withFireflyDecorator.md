---
order: 90
toc:
    depth: 2-3
---

# withFireflyDecorator

Create a `Decorator` function that returns a [FireflyDecorator](./FireflyDecorator.md) component wrapping the story with all the required plumbing to render a component using Squide Firefly, including a [RouterProvider](https://reactrouter.com/api/data-routers/RouterProvider).

## Reference

```ts
const decorator = withFireflyDecorator(runtime)
```

### Parameters

- `runtime`: A `StorybookRuntime` instance.

### Returns

A `Decorator` function.

## Usage

```tsx !#14
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const fireflyRuntime = await initializeFireflyForStorybook({
    localModules: [registerModule]
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
```


