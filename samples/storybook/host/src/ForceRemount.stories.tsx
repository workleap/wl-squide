import { initializeFireflyForStorybook, withFeatureFlagsOverrideDecorator, withFireflyDecorator } from "@squide/firefly-storybook";
import { Fragment, type ReactElement, useEffect, useState } from "react";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { HomePage } from "./HomePage.tsx";
import { QueryProvider } from "./QueryProvider.tsx";
import { registerHost } from "./registerHost.tsx";

// Regression test for https://github.com/workleap/wl-squide/issues/571
//
// Forces an unmount/remount of the entire inner decorator subtree via a React key
// change. This reproduces the race condition where a new OverrideFeatureFlags instance
// renders (calling startTransaction()) before the old instance's useEffect cleanup
// (which calls undo()) has run.
//
// Without the resetTransaction() fix, these stories crash with:
//   "[squide] There's already an active LaunchDarkly client transaction."
function ForceRemount({ renderStory }: { renderStory: () => ReactElement }) {
    const [renderKey, setRenderKey] = useState("mount-1");

    useEffect(() => {
        if (renderKey === "mount-1") {
            setRenderKey("mount-2");
        }
    }, [renderKey]);

    return <Fragment key={renderKey}>{renderStory()}</Fragment>;
}

function withForceRemountDecorator(): Decorator {
    return story => <ForceRemount renderStory={story} />;
}

function withQueryDecorator(): Decorator {
    return story => {
        return (
            <QueryProvider>
                {story()}
            </QueryProvider>
        );
    };
}

const fireflyRuntime = await initializeFireflyForStorybook({
    localModules: [registerHost],
    featureFlags: {
        "show-characters": true
    }
});

const meta = {
    title: "ForceRemount",
    component: HomePage,
    decorators: [
        withForceRemountDecorator(),
        withQueryDecorator(),
        withFireflyDecorator(fireflyRuntime)
    ],
    parameters: {
        msw: {
            handlers: [
                ...fireflyRuntime.requestHandlers
            ]
        }
    }
} satisfies Meta<typeof HomePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const WithoutCharacters = {
    decorators: [
        withFeatureFlagsOverrideDecorator({ "show-characters": false })
    ]
} satisfies Story;
