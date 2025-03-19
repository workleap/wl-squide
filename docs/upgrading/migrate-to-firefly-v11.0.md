---
order: 930
label: Migrate to firefly v11.0
---

# Migrate to firefly v11.0

## Breaking changes

### `bootstrap`

The `bootstrap` function is not `async` anymore and stop returning the bootstrapping errors:

Before:

```ts
import { bootstrap } from "@squide/firefly";

const { localModuleErrors, remoteModulesErrors } = await bootstrap({
    localModules: [...],
    remotes: [...]
})
```

After:

```ts
import { bootstrap } from "@squide/firefly";

bootstrap({
    localModules: [...],
    remotes: [...],
    onError: error => {
        ...
    } 
})
```

To handle bootstrapping errors, an `onError` handler can be provided.

## Optional changes

### `FireflyProvider`

A new `FireflyProvider` has been introduced to replace `RuntimeContext.Provider`. This change is optionnal as both are still supported, but strongly encouraged.

Before:

```tsx
import { FireflyRuntime, RuntimeContext } from "@squide/firefly";
import { createRoot } from "react-dom/client";

const runtime = new FireflyRuntime();

const root = createRoot(document.getElementById("root")!);

root.render(
    <RuntimeContext.Provider value={runtime}>
        <App />
    </RuntimeContext.Provider>
);
```

After:

```tsx
import { FireflyProvider, FireflyRuntime } from "@squide/firefly";
import { createRoot } from "react-dom/client";

const runtime = new FireflyRuntime();

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```
