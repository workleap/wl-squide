---
order: 400
label: Setup Storybook
---

# Setup Storybook

Squide provides helpers to set up a [Storybook](https://storybook.js.org/) story file for rendering components using Squide Firefly. _This guide assumes that you already have a working Storybook environment_.

## Configure Storybook

### Install the packages

To set up Storybook, first, open a terminal at the root of the Storybook application and install the following packages:

```bash
pnpm add msw msw-storybook-addon
```

### Register the MSW addon

Then, update the standard `.storybook/preview.tsx` file and register the [Mock Service Worker](https://mswjs.io/) (MSW) addon:

```tsx !#5-7,19
import { initialize as initializeMsw, mswLoader } from "msw-storybook-addon";
import { Suspense } from "react";
import type { Preview } from "storybook-react-rsbuild";

initializeMsw({
    onUnhandledRequest: "bypass"
});

const preview: Preview = {
    decorators: [
        Story => {
            return (
                <Suspense fallback="UNHANDLED SUSPENSE BOUNDARY, should be handled in your components...">
                    <Story />
                </Suspense>
            );
        }
    ],
    loaders: [mswLoader]
};

export default preview;
```

Finally, update the standard `.storybook/main.ts` file and set the `staticDirs` option to `["public"]`:

```tsx !#12
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "storybook-react-rsbuild";

const require = createRequire(import.meta.url);

const storybookConfig: StorybookConfig = {
    framework: getAbsolutePath("storybook-react-rsbuild"),
    addons: [
        getAbsolutePath("@storybook/addon-a11y")
    ],
    staticDirs: ["public"],
    rsbuildFinal: config => {
        config.plugins = config.plugins || [];

        return config;
    }
};

export default storybookConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}

```

!!!tip
Verify that MSW is properly [initialized](https://mswjs.io/docs/best-practices/managing-the-worker/), e.g. confirm that a `mockServiceWorker.js` file has been generated in the `/public` folder.
!!!

## Configure a project

### Install the packages

To set up a project, first, open a terminal at the project root and install the following packages:

```bash
pnpm add @squide/firefly-rsbuild-storybook
```

### Create a runtime instance

Then, update the story files to create a runtime instance using the [initializeFireflyForStorybook](../reference/storybook/initializeFireflyForStorybook.md) function:

```tsx !#6-8
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    title: "Page",
    component: Page
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
```

### Setup a decorator

Then, set up a decorator using the [withFireflyDecorator](../reference/storybook/withFireflyDecorator.md) function:

```tsx !#13-15
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    title: "Page",
    component: Page,
    decorators: [
        withFireflyDecorator(runtime)
    ]
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
```

Or embed the [FireflyDecorator](../reference/storybook/FireflyDecorator.md) component in an existant decorator:

```tsx !#13-19
import { initializeFireflyForStorybook, FireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    title: "Page",
    component: Page,
    decorators: [
        story => (
            <FireflyDecorator runtime={runtime}>
                {story()}
            </FireflyDecorator>
        )
    ]
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
```

### Setup MSW

Finally, forward the MSW request handlers registered by the modules to the Storybook addon:

```tsx !#20-24
import { initializeFireflyForStorybook, FireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule]
});

const meta = {
    title: "Page",
    component: Page,
    decorators: [
        story => (
            <FireflyDecorator runtime={runtime}>
                {story()}
            </FireflyDecorator>
        )
    ],
    parameters: {
        msw: {
            handlers: runtime.requestHandlers
        }
    }
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
```

## Try it :rocket:

Start the Storybook application using the development script. Then open a story that uses Squide firefly components. It should render without errors. Make a change to the story and confirm that it re-renders correctly.
