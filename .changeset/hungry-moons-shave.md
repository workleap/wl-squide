---
"@squide/firefly": minor
---

Added a new `@squide/firefly/testing` entry point exposing `createDeferredRegistrationsRunner`, a test only utility executing deferred registration functions through the same sequence as a real application.

A runner registers the provided modules, then replays their deferred registration functions for as many runs as a test requires:

```ts
import { createDeferredRegistrationsRunner } from "@squide/firefly/testing";

const runner = createDeferredRegistrationsRunner(runtime, [registerSection, registerNestedItem]);

await runner.register({ isBillingEnabled: true });
await runner.update({ isBillingEnabled: false });
```

An update run is transactional and dispatches the `DeferredRegistrationsUpdateStartedEvent` and `DeferredRegistrationsUpdateCompletedEvent` events, matching what the `useDeferredRegistrations` hook does at runtime. This replaces the hand written harnesses that applications had to maintain to test a deferred registration update run.
