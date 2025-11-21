---
order: 430
label: Use the logger
---

# Use the logger

Squide integrates with the [@workleap/logging](https://workleap.github.io/wl-logging) library by accepting a loggers array during initialization. If no loggers are provided and the application is running in [development mode](../reference/runtime/FireflyRuntime.md#change-the-runtime-mode), Squide automatically attaches a [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger) instance to the runtime.

For more details, refer to the [initializeFirefly](../reference/registration/initializeFirefly.md#register-a-logger) and [useLogger](../reference/runtime/useLogger.md) reference documentation.

## Log a message

Loggers are available throughout the application via the `FireflyRuntime` instance or the `useLogger` hook.

```ts !#1
runtime.logger.debug("Hello!");
```

```tsx !#4,6
import { useLogger } from "@squide/firefly";

export function Page() {
    const logger = useLogger();

    logger.debug("Page is rendered.");

    return (
        <div>Hello from page!</div>
    );
}
```

!!!tip
If Squide is initialized with multiple logger instances, all of them will receive the log entry.
!!!

## Setup loggers

Refer to the [Setup logger](../integrations/setup-loggers.md) integration guide.



