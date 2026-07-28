import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { Suspense } from "react";
import type { Preview } from "storybook-react-rsbuild";

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
    loaders: [
        mswLoader(async () => {
            const worker = setupWorker();

            await worker.start({ onUnhandledRequest: "bypass" });

            return worker;
        })
    ]
};

export default preview;
