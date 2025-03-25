---
"@squide/firefly": major
---

- Replace the `bootstrap` function by a new `initializeFirefly` function that takes care of creating the `FireflyRuntime` instance.
- The `FireflyRuntime` instance now expose a new `BootstrappingStore` instance.
