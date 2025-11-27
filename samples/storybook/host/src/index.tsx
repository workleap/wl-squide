import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { QueryProvider } from "./QueryProvider.tsx";
import { registerHost } from "./registerHost.tsx";

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
    }
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
