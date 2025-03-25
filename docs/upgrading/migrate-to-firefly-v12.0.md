---
order: 920
label: Migrate to firefly v12.0
---

# Migrate to firefly v12.0

This major version introduces a new [initializeFirefly](../reference/registration/initializeFirefly.md) function, replacing the `bootstrap` function. This new `initializeFirefly` function is similar the previous `bootstrap` function with the addition that it takes care of creating and returning a [Runtime](../reference/runtime/runtime-class.md) instance.

This major version introduces a new [initializeFirefly](../reference/registration/initializeFirefly.md) function that replaces the legacy `bootstrap` function. In addition to providing similar functionality, `initializeFirefly` creates and returns a [Runtime](../reference/runtime/runtime-class.md) instance.

## Breaking changes

### Removed

- The `bootstrap` function has been removed, use the [initializeFirefly](../reference/registration/initializeFirefly.md) function instead.
- The `waitForMsw` property has been removed from the [AppRouter](../reference/routing/appRouter.md) component.

### Replaced `bootstrap` by `initializeFirefly`

The `bootstrap` function has been replaced by the [initializeFirefly](../reference/registration/initializeFirefly.md) function. This new function behaves similarly to the former `bootstrap function, accepting all its previous arguments, but additionally creates and returns a [Runtime](../reference/runtime/runtime-class.md) instance.

Before:

```tsx !#10-18
import { createRoot } from "react-dom/client";
import { ConsoleLogger, FireflyProvider, FireflyRuntime, bootstrap, type RemoteDefinition } from "@squide/firefly";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime({
    loggers: [x => new ConsoleLogger(x)]
});

// Register the remote module.
bootstrap(runtime, {
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

Now:

```tsx !#10-13
import { createRoot } from "react-dom/client";
import { ConsoleLogger, FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

const runtime = initializeFirefly(runtime, {
    remotes: Remotes,
    loggers: [x => new ConsoleLogger(x)]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```D


### Remove the `waitForMsw` property of `AppRouter`

