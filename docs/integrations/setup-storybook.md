---
order: 400
label: Setup Storybook
---

# Setup Storybook

Squide provides helpers to set up a [Storybook](https://storybook.js.org/) story file for rendering components using Squide. _This guide assumes that you already have a working Storybook environment_.

## Install the packages

To set up Storybook, first, open a terminal at the root of the Storybook application and install the following packages:

```bash
pnpm add msw msw-storybook-addon
```

## Register the MSW addon

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

Then, update the standard `.storybook/main.ts` file and set the `staticDirs` option to `["public"]`:

```tsx !#9
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "storybook-react-rsbuild";

const require = createRequire(import.meta.url);

const storybookConfig: StorybookConfig = {
    framework: getAbsolutePath("storybook-react-rsbuild"),
    staticDirs: ["public"]
};

export default storybookConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}

```

## Initialize MSW

Finally, ensure that MSW is correctly initialized. Confirm that a `mockServiceWorker.js` file exists in the `/public` folder. If it's missing, open a terminal at the root of the Storybook application and execute the following command:

```bash
pnpm dlx msw init
```

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

Or embed the [FireflyDecorator](../reference/storybook/FireflyDecorator.md) component in an existing decorator:

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

Next, forward the MSW request handlers registered by the modules to the Storybook addon:

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

### Setup environment variables

Then, if the components included in the stories rely on environment variables, mock the environment variables using the [initializeFireflyForStorybook](../reference/storybook/initializeFireflyForStorybook.md) function:

```tsx !#8-10
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    environmentVariables: {
        apiBaseUrl: "https://my-api.com"
    }
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

### Setup feature flags

Finally, if the components included in the stories rely on feature flags, mock the feature flags using the [initializeFireflyForStorybook](../reference/storybook/initializeFireflyForStorybook.md) function:

```tsx !#12
import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

const featureFlags = new Map([
    ["render-summary", true]
] as const);

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    featureFlags
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

To test different variations of a feature flag, use the [withFeatureFlagsOverrideDecorator](../reference/storybook/withFeatureFlagsOverrideDecorator.md) hook:

```tsx !#31
import { initializeFireflyForStorybook, withFireflyDecorator, withFeatureFlagsOverrideDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { Page } from "./Page.tsx";
import { registerModule } from "./registerModule.tsx";

// This syntax with the nested arrays and "as const" is super important to get type safety with
// the "withFeatureFlagsOverrideDecorator" decorator.
const featureFlags = new Map([
    ["render-summary", true]
] as const);

const runtime = await initializeFireflyForStorybook({
    localModules: [registerModule],
    featureFlags
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

export const Default = {
    decorators: [
        withFeatureFlagsOverrideDecorator(featureFlags, { "render-summary": false })
    ]
} satisfies Story;
```

## Try it :rocket:

Start the Storybook application using the development script. Then open a story that uses Squide components. It should render without errors. Make a change to the story and confirm that it re-renders correctly.

### Troubleshoot issues

If you are experiencing issues with this guide:

- Set the [initializeTelemetry](https://workleap.github.io/wl-telemetry/reference/telemetry/initializetelemetry/) function `verbose` option to `true`.
- Open the [DevTools](https://developer.chrome.com/docs/devtools/) console and look for any relevant logs or errors.
- Refer to a working example on [GitHub](https://github.com/workleap/wl-squide/tree/main/samples/storybook).
- Refer to the [troubleshooting](../troubleshooting.md) page.

