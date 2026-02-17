---
"@squide/core": patch
"@squide/env-vars": patch
"@squide/fakes": patch
"@squide/firefly": patch
"@squide/firefly-module-federation": patch
"@squide/firefly-rsbuild-configs": patch
"@squide/firefly-rsbuild-storybook": patch
"@squide/firefly-webpack-configs": patch
"@squide/i18next": patch
"@squide/launch-darkly": patch
"@squide/msw": patch
"@squide/react-router": patch
---

Updated dependencies to their latest versions.

**Breaking change for @workleap/telemetry**: The `initializeTelemetry` function now requires a `ProductFamily` parameter ("sg" or "wlp") as the first argument. Also, the `useHoneycombInstrumentationClient` hook now requires the `throwOnUndefined: false` option when Honeycomb might not be initialized.
