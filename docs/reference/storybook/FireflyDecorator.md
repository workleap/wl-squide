---
order: 80
toc:
    depth: 2-3
---

# FireflyDecorator

Wrap a story with all the required plumbing to render a component using Squide Firefly, including a [RouterProvider](https://reactrouter.com/api/data-routers/RouterProvider).

## Reference

```tsx
<FireflyDecorator runtime={StorybookRuntime}>
    ...
</FireflyDecorator>
```

### Properties

- `runtime`: A `StorybookRuntime` instance.


## Usage

```tsx !#14-18
import { initializeFireflyForStorybook, FireflyDecorator } from "@squide/firefly-rsbuild-storybook";
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
        story => (
            <FireflyDecorator runtime={fireflyRuntime}>
                {story()}
            </FireflyDecorator>
        )
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
