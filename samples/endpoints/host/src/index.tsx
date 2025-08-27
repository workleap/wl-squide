import { createI18NextPlugin } from "@endpoints/i18next";
import { registerLocalModule } from "@endpoints/local-module";
import { registerShell } from "@endpoints/shell";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@workleap/honeycomb";
import { BrowserConsoleLogger, LogLevel, type RootLogger } from "@workleap/logging";
import { LogRocketLogger, registerLogRocketInstrumentation } from "@workleap/logrocket";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Remotes } from "../remotes.ts";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const loggers: RootLogger[] = [new BrowserConsoleLogger({ logLevel: LogLevel.information })];

if (process.env.LOGROCKET_APP_ID) {
    loggers.push(new LogRocketLogger());
}

if (process.env.HONEYCOMB_API_KEY) {
    registerHoneycombInstrumentation("sample", "squide-endpoints-sample", [/http:\/\/localhost:1234\.*/], {
        apiKey: process.env.HONEYCOMB_API_KEY,
        verbose: true,
        loggers
    });
} else {
    console.warn("[host] Cannot register Honeycomb instrumentation because the HONEYCOMB_API_KEY environment variable has not been configured.");
}

if (process.env.LOGROCKET_APP_ID) {
    registerLogRocketInstrumentation(process.env.LOGROCKET_APP_ID as string, {
        verbose: true,
        loggers
    });
} else {
    console.warn("[host] Cannot register LogRocket instrumentation because the LOGROCKET_APP_ID environment variable has not been configured.");
}

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerShell({ host: "@endpoints/host" }), registerHost, registerLocalModule],
    remotes: Remotes,
    plugins: [x => createI18NextPlugin(x), x => new EnvironmentVariablesPlugin(x)],
    loggers,
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
