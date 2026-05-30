---
order: 90
toc:
    depth: 2-3
---

# withFireflyDecorator

Create a `Decorator` function that returns a [FireflyDecorator](./FireflyDecorator.md) component wrapping the story with all the required plumbing to render a component using Squide, including a [RouterProvider](https://reactrouter.com/api/data-routers/RouterProvider).

## Reference

```ts
const decorator = withFireflyDecorator(runtime, options?)
```

### Parameters

- `runtime`: A `StorybookRuntime` instance.
- `options`: An optional object literal of options:
    - `route`: The route(s) mounted under Squide's `RootRoute`. A [RouteObject](https://reactrouter.com/start/data/route-object), an array of them, or a function receiving `{ story }`. Defaults to `{ path: "/story", element: story }`.
    - `initialEntries`: The in-memory router initial entries. Defaults to `["/story"]`; match it to a custom `route` `path`.

### Returns

A `Decorator` function.

## Usage

```tsx !#14
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-storybook";
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

### Customize the mounted route

Use the `route` option to attach a `handle` (read via [useMatches](https://reactrouter.com/api/hooks/useMatches)) or declare children for an [Outlet](https://reactrouter.com/api/components/Outlet):

```tsx !#5-7
const meta = {
    title: "Layout",
    component: Layout,
    decorators: [
        withFireflyDecorator(fireflyRuntime, {
            route: ({ story }) => ({ path: "/story", element: story, handle: { layout: "sidebar" } })
        })
    ]
};
```
