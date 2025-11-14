import { createI18NextPlugin } from "@endpoints/i18next";
import { registerLocalModule } from "@endpoints/local-module";
import { registerShell } from "@endpoints/shell";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger, type RootLogger } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/logrocket";
import { initializeTelemetry, TelemetryProvider, type InitializeTelemetryOptions } from "@workleap/telemetry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { Remotes } from "../remotes.ts";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const loggers: RootLogger[] = [new BrowserConsoleLogger()];

const telemetryOptions: InitializeTelemetryOptions = {
    verbose: true,
    loggers
};

if (process.env.LOGROCKET_APP_ID) {
    loggers.push(new LogRocketLogger());

    telemetryOptions.logRocket = {
        appId: process.env.LOGROCKET_APP_ID
    };
} else {
    console.warn("[host] Cannot register LogRocket instrumentation because the LOGROCKET_APP_ID environment variable has not been configured.");
}

if (process.env.HONEYCOMB_API_KEY) {
    telemetryOptions.honeycomb = {
        namespace: "sample",
        serviceName: "squide-endpoints-sample",
        apiServiceUrls: [/http:\/\/localhost:1234\.*/],
        options: {
            apiKey: process.env.HONEYCOMB_API_KEY
        }
    };
} else {
    console.warn("[host] Cannot register Honeycomb instrumentation because the HONEYCOMB_API_KEY environment variable has not been configured.");
}

const telemetryClient = initializeTelemetry(telemetryOptions);

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerShell({ host: "@endpoints/host" }), registerHost, registerLocalModule],
    // remotes: Remotes,
    startMsw: async x => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        return (await import("../mocks/browser.ts")).startMsw(x.requestHandlers);
    },
    plugins: [
        x => createI18NextPlugin(x),
        x => new EnvironmentVariablesPlugin(x)
    ],
    honeycombInstrumentationClient: telemetryClient.honeycomb,
    loggers
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <TelemetryProvider client={telemetryClient}>
            <FireflyProvider runtime={runtime}>
                <App />
            </FireflyProvider>
        </TelemetryProvider>
    </StrictMode>
);
