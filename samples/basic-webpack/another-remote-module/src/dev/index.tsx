import { registerLayouts } from "@basic-webpack/shared";
import { registerShell } from "@basic-webpack/shell";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register as registerModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerShell(), registerLayouts(), registerDev, registerModule],
    loggers: [new BrowserConsoleLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <FireflyProvider runtime={runtime}>
            <App />
        </FireflyProvider>
    </StrictMode>
);
