import { initializeFireflyForStorybook, withFireflyDecorator } from "@squide/firefly-rsbuild-storybook";
import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { HelloWorld } from "./HelloWorld.tsx";

const fireflyRuntime = await initializeFireflyForStorybook({
    useMsw: false
});

const meta = {
    title: "NoLocalModules",
    component: HelloWorld,
    decorators: [
        withFireflyDecorator(fireflyRuntime)
    ]
} satisfies Meta<typeof HelloWorld>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
