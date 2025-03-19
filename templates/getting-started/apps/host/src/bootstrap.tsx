import { register as registerMyLocalModule } from "@getting-started/local-module";
import { ConsoleLogger, FireflyRuntime, RuntimeContext, bootstrap, type RemoteDefinition } from "@squide/firefly";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime({
    loggers: [x => new ConsoleLogger(x)]
});

// Register the modules.
bootstrap(runtime, {
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
