---
"@squide/firefly-storybook": patch
---

Added a `TData` generic type parameter to `initializeFireflyForStorybook` and `InitializeFireflyForStorybookOptions` so callers can type the data passed to deferred registration functions. Defaults to `unknown`, so existing call sites are unaffected.
