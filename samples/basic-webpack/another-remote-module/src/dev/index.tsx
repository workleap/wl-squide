import { registerLayouts } from "@basic-webpack/shared";
import { registerShell } from "@basic-webpack/shell";
import { ConsoleLogger, FireflyRuntime, RuntimeContext, bootstrap } from "@squide/firefly";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register as registerModule } from "../register.tsx";
import { App } from "./App.tsx";
import { registerDev } from "./register.tsx";

// Create the shell runtime.
// Services and loggers could be reuse through a shared packages or faked when in isolation.
const runtime = new FireflyRuntime({
    loggers: [x => new ConsoleLogger(x)]
});

bootstrap(runtime, {
    localModules: [registerShell(), registerLayouts(), registerDev, registerModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <RuntimeContext.Provider value={runtime}>
            <App />
        </RuntimeContext.Provider>
    </StrictMode>
);


