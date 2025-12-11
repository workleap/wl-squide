import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { QueryProvider } from "./QueryProvider.tsx";
import { registerHost } from "./registerHost.tsx";

const launchDarklyClient = initializeLaunchDarkly(process.env.LAUNCH_DARKLY_CLIENT_ID!, {
    kind: "user",
    anonymous: true
}, {
    streaming: true
});

launchDarklyClient.on("ready", () => {
    console.log("[host] Launch darkly is ready:", launchDarklyClient.allFlags());

    const fireflyRuntime = initializeFirefly({
        mode: "development",
        useMsw: true,
        localModules: [registerHost],
        startMsw: async runtime => {
            // Files that includes an import to the "msw" package are included dynamically to prevent adding
            // unused MSW stuff to the code bundles.
            return (await import("./startMsw.ts")).startMsw(runtime.requestHandlers);
        },
        environmentVariables: {
            hostApiBaseUrl: "/host/api"
        },
        launchDarklyClient
    });

    const root = createRoot(document.getElementById("root")!);

    root.render(
        <StrictMode>
            <FireflyProvider runtime={fireflyRuntime}>
                <QueryProvider>
                    <App />
                </QueryProvider>
            </FireflyProvider>
        </StrictMode>
    );
});

try {
    await launchDarklyClient.waitForInitialization(5);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error: unknown) {
    // Do nothing.
}
