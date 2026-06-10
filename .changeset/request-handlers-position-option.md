---
"@squide/msw": minor
"@squide/firefly": minor
---

`registerRequestHandlers` now accepts a `position` option (`"start"` or `"end"`, defaulting to `"end"`). Handlers registered with `"start"` are placed before those registered with `"end"`, with registration order preserved within each group.

MSW evaluates handlers in registration order and a handler returning nothing falls through to the next matching handler, so `"start"` enables middleware-like fall-through handlers (artificial latency, request logging, chaos testing) that must run before the regular handlers — regardless of module registration timing:

```ts
runtime.registerRequestHandlers([latencyRequestHandler], { position: "start" });
```
