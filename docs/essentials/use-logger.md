---
order: 430
label: Use the logger
---

# Use the logger

Squide integrates with the [@workleap/logging](https://workleap.github.io/wl-logging) library by accepting a loggers array during initialization. If no loggers are provided and the application is running in [development mode](../reference/runtime/FireflyRuntime.md#change-the-runtime-mode), Squide automatically attaches a [BrowserConsoleLogger](https://workleap.github.io/wl-logging/reference/browserconsolelogger) instance to the runtime.

For more details, refer to the [initializeFirefly](../reference/registration/initializeFirefly.md#register-a-logger) and [useLogger](../reference/logging/useLogger.md) reference documentation.

## Log a message

To log a message, retrieve Squide logger instance throughout the application with the `useLogger` hook and write a log entry using any of the available methods:

```ts !#3,5
import { useLogger } from "@squide/firefly";

const logger = useLogger();

logger.debug("Hello!");
```

!!!tip
For more information on how to use the logger, refer to the `@workleap/logging` package's [documentation](https://workleap.github.io/wl-logging/introduction/getting-started/).
!!!

!!!warning
Never log any **Personally Identifiable Information (PII)**.

API responses frequently contain sensitive user data such as names, email addresses, phone numbers, or IDs. Remove all logs outputting API response before deploying to production, as these can expose private information that will be included in session replays.

For debugging, use `console.log` instead, since its output is not captured in LogRocket session replays.
!!!

## Setup loggers

Refer to the [Setup the logger](../integrations/setup-logger.md) integration guide.



