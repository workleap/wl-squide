import { registerLocalModule } from "@basic-webpack/local-module";
import { registerLayouts, type AppContext } from "@basic-webpack/shared";
import { registerShell } from "@basic-webpack/shell";
import { ConsoleLogger, FireflyProvider, FireflyRuntime, bootstrap } from "@squide/firefly";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Remotes } from "../remotes.js";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from "useless-lib";

console.log("[basic-sample] host:", version);

const runtime = new FireflyRuntime({
    loggers: [x => new ConsoleLogger(x)]
});

const context: AppContext = {
    name: "Test app"
};

bootstrap(runtime, {
    localModules: [registerShell({ host: "@basic/host" }), registerLayouts({ host: "@basic/host" }), registerHost, registerLocalModule],
    remotes: Remotes,
    context
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <FireflyProvider runtime={runtime}>
            <App />
        </FireflyProvider>
    </StrictMode>
);
