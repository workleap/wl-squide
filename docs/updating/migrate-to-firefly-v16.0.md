---
order: 880
label: Migrate to firefly v16.0
toc:
    depth: 2-3
---

# Migrate to firefly v16.0

This major version removes [Module Federation](https://module-federation.io/) from `@squide/firefly`. Module Federation is now optional and can be enabled by installing the `@squide/firefly-module-federation` package. To register [remote modules](../module-federation/create-remote-module.md), import the [initializeFirefly](../reference/registration/initializeFirefly.md) function from `@squide/firefly-module-federation` instead of `@squide/firefly`.

First, install the `@squide/firefly-module-federation` package:

```bash
pnpm add @squide/firefly-module-federation
```

Then, follow this example to register remote modules using the new `@squide/firefly-module-federation` package.

Before:

```tsx host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly, type RemoteDefinition } from "@squide/firefly";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Register the remote module.
const runtime = initializeFirefly({
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

After:

```tsx !#3 host/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider } from "@squide/firefly";
import { initializeFirefly, type RemoteDefinition } from "@squide/firefly-module-federation";
import { App } from "./App.tsx";

// Define the remote modules.
const Remotes: RemoteDefinition[] = [
    { name: "remote1" }
];

// Register the remote module.
const runtime = initializeFirefly({
    remotes: Remotes
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```
