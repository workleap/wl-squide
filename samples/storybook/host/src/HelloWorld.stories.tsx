import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { HelloWorld } from "./HelloWorld.tsx";

const meta = {
    title: "HelloWorld",
    component: HelloWorld
} satisfies Meta<typeof HelloWorld>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
