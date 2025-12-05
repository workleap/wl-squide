// import { createI18NextPlugin } from "@endpoints/i18next";
// import { registerLocalModule } from "@endpoints/local-module";
// import { registerShell } from "@endpoints/shell";
// import { FireflyProvider, getBooleanFeatureFlag } from "@squide/firefly";
// import { initializeFirefly } from "@squide/firefly-module-federation";
// import { BrowserConsoleLogger, type RootLogger } from "@workleap/logging";
// import { LogRocketLogger } from "@workleap/logrocket";
// import { initializeTelemetry, TelemetryProvider, type InitializeTelemetryOptions } from "@workleap/telemetry/react";
// import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";
// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import { Remote1Definition } from "../remotes.ts";
// import { App } from "./App.tsx";
// import { registerHost } from "./register.tsx";

// const launchDarklyClient = initializeLaunchDarkly(process.env.LAUNCH_DARKLY_CLIENT_ID!, {
//     kind: "user",
//     anonymous: true
// }, {
//     streaming: true
// });

// launchDarklyClient.on("ready", () => {
//     console.log("[host] LaunchDarkly is ready:", launchDarklyClient.allFlags());

//     const isLogRocketEnabled = getBooleanFeatureFlag(launchDarklyClient, "enable-log-rocket", false);
//     const isHoneycombEnabled = getBooleanFeatureFlag(launchDarklyClient, "enable-honeycomb", false);
//     const shouldRegisterLocalModule = getBooleanFeatureFlag(launchDarklyClient, "register-local-module", true);
//     const shouldRegisterRemoteModule = getBooleanFeatureFlag(launchDarklyClient, "register-remote-module", true);

//     const loggers: RootLogger[] = [new BrowserConsoleLogger()];

//     const telemetryOptions: InitializeTelemetryOptions = {
//         verbose: true,
//         loggers
//     };

//     if (process.env.LOGROCKET_APP_ID && isLogRocketEnabled) {
//         loggers.push(new LogRocketLogger());

//         telemetryOptions.logRocket = {
//             appId: process.env.LOGROCKET_APP_ID
//         };
//     } else {
//         console.warn("[host] Cannot register LogRocket instrumentation because the LOGROCKET_APP_ID environment variable has not been configured or the feature flag is off.");
//     }

//     if (process.env.HONEYCOMB_API_KEY && isHoneycombEnabled) {
//         telemetryOptions.honeycomb = {
//             namespace: "sample",
//             serviceName: "squide-endpoints-sample",
//             apiServiceUrls: [/http:\/\/localhost:1234\.*/],
//             options: {
//                 apiKey: process.env.HONEYCOMB_API_KEY
//             }
//         };
//     } else {
//         console.warn("[host] Cannot register Honeycomb instrumentation because the HONEYCOMB_API_KEY environment variable has not been configured or the feature flag is off.");
//     }

//     const telemetryClient = initializeTelemetry(telemetryOptions);

//     const runtime = initializeFirefly({
//         useMsw: !!process.env.USE_MSW,
//         localModules: [
//             registerShell({ host: "@endpoints/host" }),
//             registerHost,
//             shouldRegisterLocalModule ? registerLocalModule : undefined
//         ],
//         remotes: [
//             shouldRegisterRemoteModule ? Remote1Definition : undefined
//         ],
//         startMsw: async x => {
//             // Files that includes an import to the "msw" package are included dynamically to prevent adding
//             // unused MSW stuff to the code bundles.
//             return (await import("../mocks/browser.ts")).startMsw(x.requestHandlers);
//         },
//         plugins: [
//             x => createI18NextPlugin(x)
//         ],
//         honeycombInstrumentationClient: telemetryClient.honeycomb,
//         launchDarklyClient,
//         loggers
//     });

//     const root = createRoot(document.getElementById("root")!);

//     root.render(
//         <StrictMode>
//             <TelemetryProvider client={telemetryClient}>
//                 <FireflyProvider runtime={runtime}>
//                     <App />
//                 </FireflyProvider>
//             </TelemetryProvider>
//         </StrictMode>
//     );
// });

// try {
//     await launchDarklyClient.waitForInitialization(5);
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// } catch (error: unknown) {
//     // Do nothing.
// }

import { createI18NextPlugin } from "@endpoints/i18next";
import { registerLocalModule } from "@endpoints/local-module";
import { registerShell } from "@endpoints/shell";
import { FireflyProvider, getBooleanFeatureFlag } from "@squide/firefly";
import { initializeFirefly } from "@squide/firefly-module-federation";
import { BrowserConsoleLogger, type RootLogger } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/logrocket";
import { initializeTelemetry, TelemetryProvider, type InitializeTelemetryOptions } from "@workleap/telemetry/react";
import { initialize as initializeLaunchDarkly } from "launchdarkly-js-client-sdk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Remote1Definition } from "../remotes.ts";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const launchDarklyClient = initializeLaunchDarkly(process.env.LAUNCH_DARKLY_CLIENT_ID!, {
    kind: "user",
    anonymous: true
}, {
    streaming: true
});

try {
    await launchDarklyClient.waitForInitialization(5);

    console.log("[host] LaunchDarkly is ready:", launchDarklyClient.allFlags());
} catch (error: unknown) {
    console.error("[host] Failed to initialize LaunchDarkly client:", error);
}

const isLogRocketEnabled = getBooleanFeatureFlag(launchDarklyClient, "enable-log-rocket", true);
const isHoneycombEnabled = getBooleanFeatureFlag(launchDarklyClient, "enable-honeycomb", true);
const shouldRegisterLocalModule = getBooleanFeatureFlag(launchDarklyClient, "register-local-module", true);
const shouldRegisterRemoteModule = getBooleanFeatureFlag(launchDarklyClient, "register-remote-module", true);

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

const telemetryClient = initializeTelemetry(telemetryOptions);

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [
        registerShell({ host: "@endpoints/host" }),
        registerHost,
        shouldRegisterLocalModule ? registerLocalModule : undefined
    ],
    remotes: [
        shouldRegisterRemoteModule ? Remote1Definition : undefined
    ],
    startMsw: async x => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        return (await import("../mocks/browser.ts")).startMsw(x.requestHandlers);
    },
    plugins: [
        x => createI18NextPlugin(x)
    ],
    honeycombInstrumentationClient: telemetryClient.honeycomb,
    launchDarklyClient,
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
