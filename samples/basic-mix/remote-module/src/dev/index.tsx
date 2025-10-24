import { registerLayouts } from "@basic-mix/shared";
import { registerShell } from "@basic-mix/shell";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register as registerModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

// Registering the remote module as a static module because the "register" function
// is local when developing in isolation.
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
