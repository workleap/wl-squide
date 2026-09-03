import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { Suspense } from "react";
import type { Preview } from "storybook-react-rsbuild";

// msw-storybook-addon v3 removed "initialize" and moved "mswLoader" to the "/csf3" entry point.
// The worker is now created by a setup function handed to the loader, which is where the
// "worker.start" options that used to be passed to "initialize" now live.
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
