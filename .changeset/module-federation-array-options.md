---
"@squide/firefly-rsbuild-configs": patch
"@squide/firefly-webpack-configs": patch
---

Shared dependencies provided as an array, such as `sharedDependencies: ["my-lib"]`, are now merged with the default shared dependencies instead of replacing them. With `@squide/firefly-webpack-configs`, `exposes` provided as an array to `defineRemoteModuleFederationPluginOptions` are now exposed under their own paths instead of under index keys.
