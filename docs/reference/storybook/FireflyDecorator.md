---
order: 80
toc:
    depth: 2-3
---

# FireflyDecorator

Wrap a story with all the required plumbing to render a component using Squide, including a [RouterProvider](https://reactrouter.com/api/data-routers/RouterProvider).

## Reference

```tsx
<FireflyDecorator runtime={StorybookRuntime}>
    ...
</FireflyDecorator>
```

### Properties

- `runtime`: A `StorybookRuntime` instance.
- `route`: The route(s) mounted under Squide's `RootRoute`. A [RouteObject](https://reactrouter.com/start/data/route-object), an array of them, or a function receiving `{ story }`. Defaults to `{ path: "/story", element: story }`. Use it to attach a `handle` or declare children for an [Outlet](https://reactrouter.com/api/components/Outlet).
- `initialEntries`: The in-memory router initial entries. Defaults to `["/story"]`; match it to a custom `route` `path`.


## Usage

```tsx !#14-18
import { initializeFireflyForStorybook, FireflyDecorator } from "@squide/firefly-storybook";
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
