---
order: 600
toc:
    depth: 2-3
---

# Register local modules

A local module can be a standalone package, a sibling package in a monorepo, or a local folder within the host application. It's an architectural pattern that enforces modularity and improves an application's scalability and maintainability.

Below are the most common use cases to register a local module. For more details, refer to the [reference](../reference/registration/initializeFirefly.md) documentation.

## Register a module from a sibling package

Typically, a local module is imported from a sibling package in a monorepo. To register a local module from a sibling package, add the local module package as a dependency of the host application:

```json !#3 host/package.json
{
    "dependencies": {
        "@my-app/local-module": "workspace:*"
    }
}
```

And, update the host application's bootstrapping code to register the module using the [initializeFirefly](../reference/registration/initializeFirefly.md) function:

```tsx !#7 host/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register as registerMyLocalModule } from "@my-app/local-module";
import { App } from "./App.tsx";

const runtime = initializeFirefly(runtime, {
    localModules: [registerMyLocalModule]
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Register modules with a context object

Contextual data can be passed to local modules by providing a [context object](../reference/registration/initializeFirefly.md#provide-a-registration-context) to the [initializeFirefly](../reference/registration/initializeFirefly.md) function:

```tsx !#8-10 host/index.tsx
import { createRoot } from "react-dom/client";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { register as registerMyLocalModule } from "@my-app/local-module";
import { App } from "./App.tsx";

const runtime = initializeFirefly(runtime, {
    localModules: [registerMyLocalModule],
    context: { 
        env: "staging" 
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <App />
    </FireflyProvider>
);
```

## Register a module with an higher-order registration function

Some local modules require specific configuration. A common pattern to provide this configuration is to expose a higher-order registration function that accepts options and returns a "scoped" registration function:

```ts !#8-16,18 local-module/register.ts
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import { Page } from "./Page.tsx";

export interface RegisterOptions {
    env: "dev" | "staging" | "production" | "msw"
}

export function register({ env }: RegisterOptions = {}) {
    const fct: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
        if (env === "staging") {
            runtime.registerRoute({
                path: "/page",
                element: <Page />
            });
        }
    };

    return fct;
}
```
