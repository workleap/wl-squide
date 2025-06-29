import { createI18NextPlugin } from "@endpoints/i18next";
import { registerLocalModule } from "@endpoints/local-module";
import { registerShell } from "@endpoints/shell";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { ConsoleLogger, FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@workleap/honeycomb";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Remotes } from "../remotes.ts";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

registerHoneycombInstrumentation("sample", "squide-endpoints-sample", [/http:\/\/localhost:1234\.*/], {
    // Default to a space so it doesn't throw at runtime.
    apiKey: process.env.HONEYCOMB_API_KEY ?? " "
});

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerShell({ host: "@endpoints/host" }), registerHost, registerLocalModule],
    remotes: Remotes,
    plugins: [x => createI18NextPlugin(x), x => new EnvironmentVariablesPlugin(x)],
    loggers: [x => new ConsoleLogger(x)],
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("../mocks/browser.ts")).startMsw(runtime.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <FireflyProvider runtime={runtime}>
            <App />
        </FireflyProvider>
    </StrictMode>
);
