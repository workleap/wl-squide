---
order: 760
---

# Use a logger

By default, when running in [development mode](../reference/runtime/runtime-class.md#change-the-runtime-mode), a [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger/) is automatically added if no custom loggers are provided through the `loggers` option of the [initializeFirefly](../reference/registration/initializeFirefly.md) function. To override this behavior, provide your own loggers array during initialization:

```tsx !#7 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { MyLogger } from "./MyLogger.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    loggers: [new MyLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Production mode

To log to the browser console when Squide is not running in [development mode](../reference/runtime/runtime-class.md#change-the-runtime-mode), provide an instance of [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger/):

```tsx !#7 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    loggers: [new BrowserConsoleLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

!!!tip
To capture logs in LogRocket session replays in production, see the [add a LogRocket logger](./add-a-logrocket-logger.md) guide.
!!!


