import { createI18NextPlugin } from "@endpoints/i18next";
import { registerLocalModule } from "@endpoints/local-module";
import { registerShell } from "@endpoints/shell";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { ConsoleLogger, FireflyRuntime, RuntimeContext, bootstrap } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Remotes } from "../remotes.ts";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const runtime = new FireflyRuntime({
    useMsw: !!process.env.USE_MSW,
    plugins: [x => createI18NextPlugin(x), x => new EnvironmentVariablesPlugin(x)],
    loggers: [x => new ConsoleLogger(x)]
});

registerHoneycombInstrumentation(runtime, "squide-endpoints-sample", [/http:\/\/localhost:1234\.*/], {
    // Default to a space so it doesn't throw at runtime.
    apiKey: process.env.HONEYCOMB_API_KEY ?? " "
});

bootstrap(runtime, {
    localModules: [registerShell({ host: "@endpoints/host" }), registerHost, registerLocalModule],
    remotes: Remotes,
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("../mocks/browser.ts")).startMsw(runtime.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <RuntimeContext.Provider value={runtime}>
            <App />
        </RuntimeContext.Provider>
    </StrictMode>
);
