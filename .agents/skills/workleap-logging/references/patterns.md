# Common Patterns and Integration

## Application Logger Setup

```ts
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

const isDev = process.env.NODE_ENV === "development";

const logger = new BrowserConsoleLogger({
    logLevel: isDev ? LogLevel.debug : LogLevel.information
});
```

> **Note:** If your app uses Rsbuild or Vite, you may need `import.meta.env.DEV` instead of `process.env.NODE_ENV`.

## Error Logging

Include both contextual data (`withObject`) and the exception (`withError`) so production logs have enough information to reproduce the issue.

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

Scopes buffer entries and output them as a grouped block, making multi-step operations easy to follow in noisy console output. Style the label at `.end()` to visually indicate success or failure.

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

## LogRocket Integration

By default, LogRocket session replays exclude console output. To send log entries to LogRocket, use `LogRocketLogger` from `@workleap/telemetry` or `@workleap/logrocket`. Combine it with `CompositeLogger` to log to both browser console and LogRocket simultaneously:

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

When reviewing logging changes, verify:
- **Log levels are accurate**: `debug` for diagnostics, `error` for failures. Misclassified levels break production alerting and filtering.
- **Errors include context**: `withObject()` for relevant data and `withError()` for stack traces. Without these, production logs lack the data needed to investigate.
- **Scopes are ended**: Every `startScope()` needs a matching `.end()` — otherwise entries are buffered but never flushed.
- **No sensitive data**: Log entries may surface in LogRocket replays and dev tools. Avoid credentials, tokens, and PII.
- **CompositeLogger filters match the environment**: e.g., `debug` for LogRocket in dev, `error` for browser console in prod.
