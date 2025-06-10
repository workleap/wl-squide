---
"@squide/firefly-honeycomb": major
---

A namespace is now required to register the Honeycomb instrumentation.

Before:

```ts
registerHoneycombInstrumentation(runtime, "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});
```

Now:

```ts
registerHoneycombInstrumentation(runtime, "sample", "squide-sample", [/.+/g,], {
    proxy: "https://my-proxy.com"
});
```
