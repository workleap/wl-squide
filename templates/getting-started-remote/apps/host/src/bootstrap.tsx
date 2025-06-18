import { register as registerMyLocalModule } from "@getting-started-remote/local-module";
import { ConsoleLogger, FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Register the modules.
const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes,
    loggers: [x => new ConsoleLogger(x)]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
