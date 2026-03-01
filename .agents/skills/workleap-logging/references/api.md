# API Reference

## BrowserConsoleLogger

```ts
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

// Basic usage
const logger = new BrowserConsoleLogger();

// With minimum log level
const logger = new BrowserConsoleLogger({ logLevel: LogLevel.information });
```

## CompositeLogger

```ts
import { BrowserConsoleLogger, CompositeLogger } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = new CompositeLogger([
    new BrowserConsoleLogger(),
    new LogRocketLogger()
]);
```

## Logger Methods

**Simple logging:**
```ts
logger.debug("message");
logger.information("message");
logger.warning("message");
logger.error("message");
logger.critical("message");
```

**Chained segments (complete chain with log method):**
```ts
logger
    .withText("Processing order")
    .withObject({ orderId: 123 })
    .withError(new Error("Failed"))
    .error();
```

**Styled text:**
```ts
logger.withText("Success", {
    style: { color: "green", fontWeight: "bold" }
}).information();
```

**Line breaks:**
```ts
logger
    .withText("Line 1")
    .withLineChange()
    .withText("Line 2")
    .debug();
```

## Scopes

```ts
const scope = logger.startScope("User signup");

scope.information("Form loaded");
scope.debug("Validating...");
scope.withText("Failed").withError(err).error();

// Output all scope entries
scope.end();

// Or dismiss without output
scope.end({ dismiss: true });
```

**Styled scope labels:**
```ts
// At creation
const scope = logger.startScope("Label", {
    labelStyle: { backgroundColor: "purple", color: "white" }
});

// At end (useful for status-based styling)
scope.end({
    labelStyle: { backgroundColor: "green", color: "white" }
});
```

## createCompositeLogger

Factory function to create a `CompositeLogger` instance from Workleap libraries standard logging API.

```ts
import { createCompositeLogger, BrowserConsoleLogger } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = createCompositeLogger(false, [new BrowserConsoleLogger(), new LogRocketLogger()]);
```

**Parameters:**
- `verbose`: Whether debug information should be logged. If no loggers are provided, creates with a `BrowserConsoleLogger` by default.
- `loggers`: Array of loggers to create the `CompositeLogger` with.

## Log Level Guidelines

| Environment | Recommended Level |
|-------------|-------------------|
| Development | `debug` |
| Production  | `information` |
