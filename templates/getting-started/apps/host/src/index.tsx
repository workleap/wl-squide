import { register as registerMyLocalModule } from "@getting-started/local-module";
import { ConsoleLogger, FireflyProvider, initializeFirefly } from "@squide/firefly";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Register the modules.
const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    loggers: [x => new ConsoleLogger(x)]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
