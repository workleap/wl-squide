---
order: 910
label: Migrate to firefly v13.0
---

# Migrate to firefly v13.0

!!!warning
If you are migrating from `v8.*`, follow the [Migrate from v8.* to v13.0](./migrate-from-v8-to-v13.0.md) guide.
!!!

This major version deprecates the [@squide/firefly-honeycomb](https://www.npmjs.com/package/@squide/firefly-honeycomb) package in favor of [@workleap/honeycomb](https://www.npmjs.com/package/@workleap/honeycomb).

Host applications can now automatically get Honeycomb performance traces for Squide's' applications by registering `@workleap/honeycomb` v5 or higher instrumentation.

When a host application registers `@workleap/honeycomb` instrumentation, Squide will detect it automatically and dynamically register everything needed to traces to performance of it's bootstrapping process, no additional setup required.

## Breaking changes

### `@squide/firefly-honeycomb` deprecation

Host application should now register Honeycomb instrumentation using `@workleap/honeycomb` instead of `@squide/firefly-honeycomb`.

To ensure full functionality, make sure to register the Honeycomb instrumentation before initializing Squide.

Before:

```tsx !#2,11-13 bootstrap.tsx
import { initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";
import { register as registerMyLocalModule } from "@sample/local-module";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes
});

registerHoneycombInstrumentation(runtime, "sample", "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});
```

After:

```tsx !#2,7-9 bootstrap.tsx
import { initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@workleap/honeycomb";
import { register as registerMyLocalModule } from "@sample/local-module";
import { registerHost } from "./register.tsx";

// Register Honeycomb instrumentation BEFORE initializing Squide.
registerHoneycombInstrumentation("sample", "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes
});
```

