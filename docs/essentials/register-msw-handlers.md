---
order: 460
label: Register MSW request handlers
---

# Register MSW request handlers

By allowing consumers to register dynamic request handlers, Squide enables developers to build scalable modular applications with well-defined boundaries. Each module contributes its own [Mock Service Workers](https://mswjs.io/), which the host assembles into a unified set.

For more details, refer to the [reference](../reference/runtime/FireflyRuntime.md) documentation.

## Register an handler

Before registering a handler, make sure MSW is enabled by checking with [isMswEnabled](../reference/runtime/FireflyRuntime.md#validate-if-msw-is-enabled). This prevents MSW handlers from being registered in production.

```ts !#4,7,9
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    if (runtime.isMswEnabled) {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW code in production bundles.
        const requestHandlers = (await import("../mocks/handlers.ts")).requestHandlers;

        runtime.registerRequestHandlers(requestHandlers);
    }
};
```

!!!tip
Always use dynamic imports for files that reference MSW packages to avoid including unused MSW code in production bundles.
!!!

## Setup MSW

Refer to the [Setup MSW](../integrations/setup-msw.md) integration guide.
