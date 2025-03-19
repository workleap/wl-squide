import { createI18NextPlugin } from "@endpoints/i18next";
import { registerShell } from "@endpoints/shell";
import { EnvironmentVariablesPlugin } from "@squide/env-vars";
import { ConsoleLogger, FireflyProvider, FireflyRuntime, bootstrap } from "@squide/firefly";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register as registerModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

// Create the shell runtime.
// Services and loggers could be reuse through a shared packages or faked when in isolation.
const runtime = new FireflyRuntime({
    useMsw: !!process.env.USE_MSW,
    plugins: [x => createI18NextPlugin(x), x => new EnvironmentVariablesPlugin(x)],
    loggers: [x => new ConsoleLogger(x)]
});

bootstrap(runtime, {
    // Registering the remote module as a static module because the "register" function
    // is local when developing in isolation.
    localModules: [registerShell(), registerDev, registerModule],
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


