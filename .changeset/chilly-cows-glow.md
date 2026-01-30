---
"@squide/firefly-module-federation": patch
"@squide/firefly-rsbuild-storybook": patch
"@squide/firefly": patch
"@squide/core": patch
---

`initializeFireflyForStorybook` now accept a `useMsw` option to opt-out of MSW and will now render as expected if no local modules are provided.
