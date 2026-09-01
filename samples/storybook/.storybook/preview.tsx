import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { Suspense } from "react";
import type { Preview } from "storybook-react-rsbuild";

async function startMswWorker() {
    const worker = setupWorker();

    await worker.start({
        onUnhandledRequest: "bypass"
    });

    return worker;
}

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
    loaders: [mswLoader(startMswWorker)]
};

export default preview;
