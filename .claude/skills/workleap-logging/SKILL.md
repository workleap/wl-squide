---
name: workleap-logging
description: |
  Guide for @workleap/logging, a structured logging library for Workleap frontend TypeScript applications.

  Use this skill when:
  (1) Setting up or configuring @workleap/logging loggers (BrowserConsoleLogger, CompositeLogger)
  (2) Using @workleap/logging API: log levels, chained segments, scopes, styled output
  (3) Composing or filtering loggers for multi-destination logging (LogRocket, telemetry)
  (4) Working with Squide's useLogger hook alongside @workleap/logging
  (5) Reviewing PRs or troubleshooting logging code in Workleap TypeScript projects

  This skill also applies when the user discusses frontend logging, console logging, or structured logging in a Workleap context without naming the package directly.
metadata:
  version: 1.3
---

# Workleap Logging (@workleap/logging)

A structured logging library for Workleap frontend applications. Provides composable, styled console logging with support for scopes, multiple log levels, and integration with telemetry tools.

The library exports four key types: `Logger` (base interface), `RootLogger` (extends Logger with scope support), `BrowserConsoleLogger`, and `CompositeLogger`.

## Installation

```bash
pnpm add @workleap/logging
```

## Core Concepts

### Loggers
- **BrowserConsoleLogger**: Outputs to browser console with styling support
- **CompositeLogger**: Forwards logs to multiple underlying loggers
- **createCompositeLogger(verbose, loggers)**: Factory function that creates a `CompositeLogger`. When `verbose` is `true` and no loggers are provided, it adds a `BrowserConsoleLogger`; otherwise it uses only the loggers you pass (an empty list produces no output). See `references/api.md` for details.

### Log Levels (lowest to highest severity)
1. `debug` - Detailed diagnostic info for development
2. `information` - General application flow events
3. `warning` - Non-critical issues needing attention
4. `error` - Failures that prevent functionality from completing (triggers alerting in production)
5. `critical` - Severe errors risking data integrity

### Scopes

Scopes buffer log entries in memory and output them as a grouped block when `.end()` is called. This makes it easier to trace multi-step operations in noisy console output.

```ts
const scope = logger.startScope("User signup");
scope.debug("Validating...");
scope.information("Signup complete");
scope.end();
```

The `Logger` interface doesn't expose `startScope` because scoping is a root-level concern. When using Squide's `useLogger()`, the return type is `Logger`, so cast to `RootLogger` to access scope methods:

```ts
import { useLogger } from "@squide/firefly";
import type { RootLogger } from "@workleap/logging";

const logger = useLogger();
(logger as RootLogger).startScope("User signup");
```

## Chained Segments

Build complex log entries by chaining segments. A chain without a terminal log level method (`.debug()`, `.error()`, etc.) silently produces no output — this is the most common source of missing logs.

```ts
logger
    .withText("Processing order")
    .withObject({ orderId: 123 })
    .withError(new Error("Failed"))
    .error();
// Output: [error] Processing order { orderId: 123 } Error: Failed
```

## Common Pitfalls

1. **Forgetting the terminal log method**: Chained segments without `.debug()`, `.error()`, etc. silently produce no output.
2. **Not ending scopes**: Scoped entries are buffered in memory and only flushed to the console when `.end()` is called. Without it, the logs are silently lost.
3. **Using `warning` for failures**: Reserve `error` for failures — `warning` is for non-critical issues. This distinction matters because production alerting and log filtering depend on accurate severity.
4. **Logging sensitive data**: Log entries may appear in LogRocket session replays and browser dev tools, so including credentials or PII creates compliance and security exposure.
5. **Missing error context**: Without `withObject()` for relevant data and `withError()` for exceptions, error logs lack the information needed to reproduce issues in production.

## Reference Guide

- **`references/api.md`** — Read when you need constructor signatures, the full method list (styled text, line breaks, withObject, withError), scope lifecycle API, or createCompositeLogger details.
- **`references/patterns.md`** — Read when setting up a logger from scratch, integrating with LogRocket, implementing scoped logging for features/operations, or conducting a PR review of logging code.
