import { initializeFireflyForStorybook, withFeatureFlagsOverrideDecorator, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Decorator, Meta, StoryObj } from "storybook-react-rsbuild";
import { HomePage } from "./HomePage.tsx";
import { QueryProvider } from "./QueryProvider.tsx";
import { registerHost } from "./registerHost.tsx";

function withQueryDecorator(): Decorator {
    return story => {
        return (
            <QueryProvider>
                {story()}
            </QueryProvider>
        );
    };
}

const featureFlags = new Map<string, unknown>(Object.entries({
    "show-characters": true
}));

const fireflyRuntime = await initializeFireflyForStorybook({
    localModules: [registerHost],
    featureFlags: featureFlags
});

const meta = {
    title: "HomePage",
    component: HomePage,
    decorators: [
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
        withFeatureFlagsOverrideDecorator(featureFlags, { "show-characters": false })
    ]
} satisfies Story;
