---
"@squide/firefly": major
---

Deprecated `@squide/firefly-honeycomb` and moved honeycomb features directly into `@squide/firefly`. Honeycomb instrumentation is now automatically registered when Squide detected that the host application has register Honeycomb instrumentation using the `@workleap/honeycomb` package.

Before:

```ts
import { ConsoleLogger, initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@squide/firefly-honeycomb";
import { register as registerMyLocalModule } from "@sample/local-module";
import { registerHost } from "./register.tsx";

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes,
    loggers: [x => new ConsoleLogger(x)]
});

registerHoneycombInstrumentation(runtime, "sample", "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});
```

After:

```ts
import { ConsoleLogger, initializeFirefly } from "@squide/firefly";
import { registerHoneycombInstrumentation } from "@workleap/honeycomb";
import { register as registerMyLocalModule } from "@sample/local-module";
import { registerHost } from "./register.tsx";

// Register Honeycomb instrumentation BEFORE initializing Squide.
registerHoneycombInstrumentation("sample", "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});

const runtime = initializeFirefly({
    localModules: [registerHost, registerMyLocalModule],
    remotes: Remotes,
    loggers: [x => new ConsoleLogger(x)]
});
```


