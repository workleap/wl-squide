import { createI18NextPlugin } from "@endpoints/i18next";
import { registerShell } from "@endpoints/shell";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { ConsoleLogger, FireflyProvider, initializeFirefly } from "@squide/firefly";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerLocalModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

const runtime = initializeFirefly({
    useMsw: !!process.env.USE_MSW,
    localModules: [registerShell(), registerDev, registerLocalModule],
    plugins: [x => createI18NextPlugin(x), x => new EnvironmentVariablesPlugin(x)],
    loggers: [x => new ConsoleLogger(x)],
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("../../mocks/browser.ts")).startMsw(runtime.requestHandlers);
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


