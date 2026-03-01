# Common Patterns and Integration

## Application Logger Setup

```ts
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

const isDev = process.env.NODE_ENV === "development";

const logger = new BrowserConsoleLogger({
    logLevel: isDev ? LogLevel.debug : LogLevel.information
});
```

## Error Logging

```ts
try {
    await processOrder(orderId);
} catch (error) {
    logger
        .withText("Failed to process order")
        .withObject({ orderId })
        .withError(error as Error)
        .error();
}
```

## Feature/Operation Scoping

```ts
async function registerModule(moduleName: string) {
    const scope = logger.startScope(`${moduleName} registration`);

    try {
        scope.debug("Registering routes...");
        await registerRoutes();
        scope.debug("Routes registered");

        scope.debug("Fetching data...");
        await fetchData();
        scope.debug("Data loaded");

        scope.end({ labelStyle: { color: "green" } });
    } catch (error) {
        scope.withText("Registration failed").withError(error as Error).error();
        scope.end({ labelStyle: { color: "red" } });
        throw error;
    }
}
```

## Multi-Destination Logging

```ts
import { BrowserConsoleLogger, CompositeLogger, LogLevel } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = new CompositeLogger([
    new BrowserConsoleLogger({
        logLevel: LogLevel.error
    }),
    new LogRocketLogger({
        logLevel: LogLevel.debug
    })
]);
```

## LogRocket Integration

By default, LogRocket session replays exclude console output. To send log entries to LogRocket, use `LogRocketLogger` from `@workleap/telemetry` or `@workleap/logrocket`:

```ts
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = new LogRocketLogger();
logger.debug("Application started!");
```

Use `CompositeLogger` to send logs to both browser console and LogRocket:

```ts
import { BrowserConsoleLogger, CompositeLogger } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = new CompositeLogger([
    new BrowserConsoleLogger(),
    new LogRocketLogger()
]);

logger.debug("Application started!"); // Processed by both loggers
```

## PR Review Checklist

When reviewing logging changes:
- Verify appropriate log levels (debug for diagnostics, error for failures)
- Check that errors include context (withObject) and stack traces (withError)
- Ensure scopes are properly ended (end() or end({ dismiss: true }))
- Confirm no sensitive data in log messages
- Verify CompositeLogger filters are set per environment
