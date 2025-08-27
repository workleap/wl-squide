import { register as registerMyLocalModule } from "@getting-started-remote/local-module";
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";
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
    loggers: [new BrowserConsoleLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
