# API Reference

## BrowserConsoleLogger

```ts
import { BrowserConsoleLogger, LogLevel } from "@workleap/logging";

// Basic usage
const logger = new BrowserConsoleLogger();

// With minimum log level (messages below this severity are suppressed)
const logger = new BrowserConsoleLogger({ logLevel: LogLevel.information });
```

## CompositeLogger

Forwards logs to multiple underlying loggers. Each logger can have its own minimum log level, so you can filter differently per destination.

```ts
import { BrowserConsoleLogger, CompositeLogger, LogLevel } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = new CompositeLogger([
    new BrowserConsoleLogger({ logLevel: LogLevel.error }),
    new LogRocketLogger({ logLevel: LogLevel.debug })
]);
```

## createCompositeLogger

Factory function that creates a `CompositeLogger`. When `verbose` is `true` and no loggers are provided, a default `BrowserConsoleLogger` is added. Otherwise, only the loggers you pass are used, an empty list results in no output.

```ts
import { createCompositeLogger, BrowserConsoleLogger } from "@workleap/logging";
import { LogRocketLogger } from "@workleap/telemetry"; // or from "@workleap/logrocket"

const logger = createCompositeLogger(false, [new BrowserConsoleLogger(), new LogRocketLogger()]);
```

**Parameters:**
- `verbose`: When `true` and no loggers are provided, a default `BrowserConsoleLogger` is added. Does not affect behavior when loggers are explicitly passed.
- `loggers`: Array of loggers to create the `CompositeLogger` with. If empty and `verbose` is `false`, the resulting logger produces no output.

## Logger Methods

**Simple logging:**
```ts
logger.debug("message");
logger.information("message");
logger.warning("message");
logger.error("message");
logger.critical("message");
```

**Chained segments** (see SKILL.md for the core pattern):
```ts
// Styled text
logger.withText("Success", {
    style: { color: "green", fontWeight: "bold" }
}).information();

// Line breaks
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

// At end (useful for status-based styling, e.g., green for success, red for failure)
scope.end({
    labelStyle: { backgroundColor: "green", color: "white" }
});
```

## Log Level Guidelines

| Environment | Recommended Level |
|-------------|-------------------|
| Development | `debug` |
| Production  | `information` |
