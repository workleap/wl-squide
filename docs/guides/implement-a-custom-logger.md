---
order: 720
---

# Implement a custom logger

Many applications must integrate with specific remote logging solutions. To facilitate this integration, the shell runtime accepts any custom loggers implementing the [Logger](/reference/logging/Logger.md) interface.

## Create a custom logger class

First, let's define a custom logger:

```ts host/src/customerLogger.ts
import { Logger, type LogLevel, type Runtime } from "@squide/firefly";

export class CustomLogger implements Logger {
    readonly #logLovel: LogLevel

    constructor(runtime: Runtime, logLevel: LogLevel = LogLevel.debug) {
        super(CustomLogger.name, logLevel);

        this.#logLevel = logLevel;
    }

    debug(log: string, ...rest: unknown[]): Promise<unknown> {
        if (this.#logLevel <= LogLevel.debug) {
            console.log(`[custom-logger] ${log}`, ...rest);
        }

        return Promise.resolve();
    }

    information(log: string, ...rest: unknown[]): Promise<unknown> {
        if (this.#logLevel <= LogLevel.information) {
            console.info(`[custom-logger] ${log}`, ...rest);
        }

        return Promise.resolve();
    }

    warning(log: string, ...rest: unknown[]): Promise<unknown> {
        if (this.#logLevel <= LogLevel.warning) {
            console.warn(`[custom-logger] ${log}`, ...rest);
        }

        return Promise.resolve();
    }

    error(log: string, ...rest: unknown[]): Promise<unknown> {
        if (this.#logLevel <= LogLevel.error) {
            console.error(`[custom-logger] ${log}`, ...rest);
        }

        return Promise.resolve();
    }

    critical(log: string, ...rest: unknown[]): Promise<unknown> {
        if (this.#logLevel <= LogLevel.critical) {
            console.error(`[custom-logger] ${log}`, ...rest);
        }

        return Promise.resolve();
    }
}
```

 Then create a [FireflyRuntime](/reference/runtime/runtime-class.md) instance configured with an instance of the new `CustomLogger`:

```ts host/src/index.tsx
import { FireflyRuntime } from "@squide/firefly";
import { CustomLogger } from "./customLogger.ts";

const runtime = new FireflyRuntime({
    loggers: [x => new CustomLogger(x)],
});
```

## Try it :rocket:

Start the applications and open the developer tools, then, refresh the page. You should see the following console log message:

```
> [custom-logger] [squide] Found 1 local module to register.
```


