---
"@squide/msw": minor
"@squide/firefly": minor
---

`registerRequestHandlers` now accepts a `prepend` option (mirroring `registerRoute`'s `hoist` flag). Prepended handlers are placed before the appended ones, with registration order preserved within each group.

MSW evaluates handlers in registration order and a handler returning nothing falls through to the next matching handler, so `prepend` enables middleware-like fall-through handlers (artificial latency, request logging, chaos testing) that must run before the regular handlers — regardless of module registration timing:

```ts
runtime.registerRequestHandlers([latencyRequestHandler], { prepend: true });
```
