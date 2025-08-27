---
order: 760
---

# Use loggers

By default, when running in [development mode](../reference/runtime/runtime-class.md#change-the-runtime-mode), a [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger/) is automatically added if no custom loggers are provided through the `loggers` option of the [initializeFirefly](../reference/registration/initializeFirefly.md) function.

## Use a custom logger

To override this behavior, provide your own loggers array during initialization:

```tsx !#7 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
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

## Enable console logging in production

To log to the browser console when Squide is running in [production mode](../reference/runtime/runtime-class.md#change-the-runtime-mode), install the [@workleap/logging](https://www.npmjs.com/package/@workleap/logging) package and provide an instance of [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger/):

```tsx !#8 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    mode: "production",
    loggers: [new BrowserConsoleLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Capture logs in LogRocket

To capture logs in LogRocket session replays, install the [@workleap/logrocket](https://www.npmjs.com/package/@workleap/logrocket) package and provide an instance of [LogRocketLogger](https://workleap.github.io/wl-telemetry/logrocket/reference/logrocketlogger/):

```tsx !#7 host/src/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { LogRocketLogger } from "@workleap/logrocket";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    loggers: [new LogRocketLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Custom logs

Once loggers are configured, the application can output custom log entries using either the [useLogger](../reference/runtime/useLogger.md) hook or the [FireflyRuntime](../reference/runtime/runtime-class.md#log-a-message) instance:

```ts !#3,5
import { useLogger } from "@squide/firefly";

const logger = useLogger();

logger.debug("Hello!");
```

```ts !#5
import { useRuntime } from "@squide/firefly";

const runtime = useRuntime();

runtime.logger.debug("Hello!");
```




