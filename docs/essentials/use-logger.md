---
order: 430
label: Use the logger
---

# Use the logger

Squide integrates with the [@workleap/logging](https://workleap.github.io/wl-logging) library by accepting a loggers array during initialization. If no loggers are provided and the application is running in [development mode](../reference/runtime/FireflyRuntime.md#change-the-runtime-mode), Squide automatically attaches a [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger) instance to the runtime.

For more details, refer to the [initializeFirefly](../reference/registration/initializeFirefly.md#register-a-logger) and [useLogger](../reference/logging/useLogger.md) reference documentation.

## Log a message

To log a message, retrieve Squide logger instance throughout the application with the `useLogger` hook and write a log entry using any of the available methods:

```tsx !#1,3
const logger = useLogger();

logger.debug("Hello!");
```

!!!tip
If Squide is initialized with multiple logger instances, all of them will receive the log entries.
!!!

## Setup loggers

Refer to the [Setup logger](../integrations/setup-loggers.md) integration guide.



