import { registerLayouts } from "@basic-webpack/shared";
import { registerShell } from "@basic-webpack/shell";
import { ConsoleLogger, FireflyProvider, initializeFirefly } from "@squide/firefly";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerLocalModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerShell(), registerLayouts(), registerDev, registerLocalModule],
    loggers: [x => new ConsoleLogger(x)]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <FireflyProvider runtime={runtime}>
            <App />
        </FireflyProvider>
    </StrictMode>
);


