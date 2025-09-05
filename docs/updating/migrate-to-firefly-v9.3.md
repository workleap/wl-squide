---
order: 950
label: Migrate to firefly v9.3
---

# Migrate to firefly v9.3

!!!warning
If you are migrating from `v8.*`, follow the [Migrate from v8.* to v14.0](./migrate-from-v8-to-v14.0.md) guide.
!!!

This minor version deprecate the [registerLocalModules](../reference/registration/registerLocalModules.md), [registerRemoteModules](../reference/registration/registerRemoteModules.md) and [setMswAsReady](../reference/msw/setMswAsReady.md) in favor of a `bootstrap` function.

## Deprecation

- The [registerLocalModules](../reference/registration/registerLocalModules.md) function has been **deprecated**, use the `bootstrap` function instead.
- The [registerRemoteModules](../reference/registration/registerRemoteModules.md) function has been **deprecated**, use the `bootstrap` function instead.
- The [setMswAsReady](../reference/msw/setMswAsReady.md) function has been **deprecated**, use the `bootstrap` function instead.

## Migrate an host application

The `bootstrap` function is a new primitive that simplifies the bootstrapping of a Squide application. It replaces the [registerLocalModules](../reference/registration/registerLocalModules.md), [registerRemoteModules](../reference/registration/registerRemoteModules.md) and [setMswAsReady](../reference/msw/setMswAsReady.md) functions.

### Modules registration

To update an application's module registration code, replace the `registerLocalModules` and `registerRemoteModules` functions with a call to the `bootstrap` function:

```ts
await bootstrap({
    localModules: [...],
    remotes: [...]
})
```

Before:

```tsx !#16,19 bootstrap.tsx
import { RuntimeContext, FireflyRuntime, registerRemoteModules, registerLocalModules, type RemoteDefinition } from "@squide/firefly";
import { register as registerMyLocalModule } from "@getting-started/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime();

// Register the local module.
await registerLocalModules([registerHost, registerMyLocalModule], runtime);

// Register the remote module.
await registerRemoteModules(Remotes, runtime);

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

Now:

```tsx !#16-19 bootstrap.tsx
import { RuntimeContext, FireflyRuntime, bootstrap, type RemoteDefinition } from "@squide/firefly";
import { register as registerMyLocalModule } from "@getting-started/local-module";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Create the shell runtime.
const runtime = new FireflyRuntime(});

// Register the modules.
await bootstrap(runtime, {
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

### Mock Service Worker

The MSW bootstrapping logic has been moved from user code to the `bootstrap` function. To update an application, replace the user code with the `startMsw` option of the bootstrap function.

Before:

```tsx !#18,26-40 bootstrap.tsx
import { 
    RuntimeContext,
    FireflyRuntime,
    registerRemoteModules,
    registerLocalModules,
    setMswAsReady,
    type RemoteDefinition
} from "@squide/firefly";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

const runtime = new FireflyRuntime({
    useMsw: !!process.env.USE_MSW
});

await registerLocalModules([registerHost], runtime);

await registerRemoteModules(Remotes, runtime);

// Once both register functions are done, we can safely assume that all the request handlers has been registered.
if (runtime.isMswEnabled) {
    // Files that includes an import to the "msw" package are included dynamically to prevent adding
    // unused MSW stuff to the application bundles.
    const startMsw = (await import("../mocks/browser.ts")).startMsw;

    // Will start MSW with the modules request handlers.
    startMsw(runtime.requestHandlers)
        .then(() => {
            // Indicate that MSW is ready and the routes can now be safely rendered.
            setMswAsReady();
        })
        .catch((error: unknown) => {
            runtime.logger.debug("[host-app] An error occured while starting MSW.", error);
        });
}

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

Now:

```tsx !#11,17-21 bootstrap.tsx
import { RuntimeContext, FireflyRuntime, bootstrap, type RemoteDefinition } from "@squide/firefly";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { registerHost } from "./register.tsx";

const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

const runtime = new FireflyRuntime({
    useMsw: !!process.env.USE_MSW
});

await bootstrap(runtime, {
    localModules: [registerHost],
    remote: Remotes,
    startMsw: async () => {
        // Files that includes an import to the "msw" package are included dynamically to prevent adding
        // unused MSW stuff to the code bundles.
        (await import("../mocks/browser.ts")).startMsw(runtime.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```
