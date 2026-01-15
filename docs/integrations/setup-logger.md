---
order: 410
label: Setup the logger
---

# Setup the logger

Squide logger provides visibility into the application's bootstrapping flow and how modules behave and interact. It also offers an abstraction that allows applications to emit custom logs to multiple destinations defined by the host application.

By default, when running in [development mode](../reference/runtime/FireflyRuntime.md#change-the-runtime-mode), a [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger/) is automatically added if no custom loggers are provided through the `loggers` option of the [initializeFirefly](../reference/registration/initializeFirefly.md) function.

## Configure loggers

To replace the default console logging behavior, configure your own loggers during initialization:

```tsx !#7
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

To keep logging to the console, first, open a terminal at the root of the host application and install the [@workleap/logging](https://www.npmjs.com/package/@workleap/logging) package:

``` bash
pnpm add @workleap/logging
```

Then, explicitly provide a `BrowserConsoleLogger` instance:

```tsx !#8
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { BrowserConsoleLogger } from "@workleap/logging";
import { MyLogger } from "./MyLogger.tsx";
import { App } from "./App.tsx";

const runtime = initializeFirefly({
    loggers: [new MyLogger(), new BrowserConsoleLogger()]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Capture logs in LogRocket

To capture logs in LogRocket session replays, first, open a terminal at the root of the host application and install the [@workleap/telemetry](https://www.npmjs.com/package/@workleap/telemetry) or [@workleap/logrocket](https://www.npmjs.com/package/@workleap/logrocket) package:

``` bash
pnpm add @workleap/telemetry
```

or:

``` bash
pnpm add @workleap/logrocket
```

Then, provide an instance of [LogRocketLogger](https://workleap.github.io/wl-telemetry/reference/logrocketlogger/) at initialization:

```tsx !#7
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { LogRocketLogger } from "@workleap/telemetry/react"; // or from "@workleap/logrocket/react";
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

## Enable console logging in production

To log to the browser console when Squide is running in [production mode](../reference/runtime/FireflyRuntime.md#change-the-runtime-mode), first, open a terminal at the root of the host application and install the [@workleap/logging](https://www.npmjs.com/package/@workleap/logging) package:

``` bash
pnpm add @workleap/logging
```

Then, provide an instance of `BrowserConsoleLogger` at initialization:

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

## Custom logs

Once loggers are configured, the application can output custom log entries using either the [useLogger](../reference/logging/useLogger.md) hook or the [FireflyRuntime](../reference/runtime/FireflyRuntime.md#log-a-message) instance.

For more details, refer to the [use the logger](../essentials/use-logger.md) essential page.

## Try it :rocket:

Start the application in a development environment. Open the [DevTools](https://developer.chrome.com/docs/devtools/) console, render a page, and look for log entries such as:

- `[squide] Found X local modules to register.`
- `[squide] 1/X Registering local module.`
- `[squide] Successfully registered local module.`
