import { createI18NextPlugin } from "@endpoints/i18next";
import { registerShell } from "@endpoints/shell";
import { FireflyProvider, getFeatureFlag, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger, RootLogger } from "@workleap/logging";
import { type InitializeTelemetryOptions, initializeTelemetry, LogRocketLogger, TelemetryProvider } from "@workleap/telemetry/react";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register as registerModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

declare module "@squide/firefly" {
    interface FeatureFlags {
        "enable-log-rocket": boolean;
        "enable-honeycomb": boolean;
    }
}

const launchDarklyClient = initializeLaunchDarkly(process.env.LAUNCH_DARKLY_CLIENT_ID!, {
    kind: "user",
    anonymous: true
}, {
    streaming: true
});

try {
    await launchDarklyClient.waitForInitialization(5);

    console.log("[isolated-host] LaunchDarkly is ready:", launchDarklyClient.allFlags());
} catch (error: unknown) {
    console.error("[isolated-host] Failed to initialize the LaunchDarkly client:", error);
}

const isLogRocketEnabled = getFeatureFlag(launchDarklyClient, "enable-log-rocket", true);
const isHoneycombEnabled = getFeatureFlag(launchDarklyClient, "enable-honeycomb", true);

const loggers: RootLogger[] = [new BrowserConsoleLogger()];

const telemetryOptions: InitializeTelemetryOptions = {
    verbose: true,
    loggers
};

if (process.env.LOGROCKET_APP_ID && isLogRocketEnabled) {
    loggers.push(new LogRocketLogger());

    telemetryOptions.logRocket = {
        appId: process.env.LOGROCKET_APP_ID
    };
} else {
    console.warn("[host] Cannot register LogRocket instrumentation because the LOGROCKET_APP_ID environment variable has not been configured or the feature flag is off.");
}

if (process.env.HONEYCOMB_API_KEY && isHoneycombEnabled) {
    telemetryOptions.honeycomb = {
        namespace: "sample",
        serviceName: "squide-endpoints-sample",
        apiServiceUrls: [/http:\/\/localhost:1234\.*/],
        options: {
            apiKey: process.env.HONEYCOMB_API_KEY
        }
    };
} else {
    console.warn("[host] Cannot register Honeycomb instrumentation because the HONEYCOMB_API_KEY environment variable has not been configured or the feature flag is off.");
}

const telemetryClient = initializeTelemetry("wlp", telemetryOptions);

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    // Registering the remote module as a static module because the "register" function
    // is local when developing in isolation.
    localModules: [registerShell(), registerDev, registerModule],
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("../../mocks/browser.ts")).startMsw(runtime.requestHandlers);
    },
    ...(telemetryClient.honeycomb ? { honeycombInstrumentationClient: telemetryClient.honeycomb } : {}),
    launchDarklyClient,
    plugins: [x => createI18NextPlugin(x)],
    loggers: [new BrowserConsoleLogger()]
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
