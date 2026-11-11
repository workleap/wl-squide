---
"@squide/firefly-webpack-configs": patch
---

`@module-federation/enhanced` 2.9.3 fails to load with `webpack` 5.112 and later (`Cannot find module 'webpack/lib/util/extractUrlAndGlobal'`, see [module-federation/core#5202](https://github.com/module-federation/core/issues/5202)). Until a fixed version is released, the `webpack` peer dependency range is capped to `>=5.110.3 <5.112.0` and `@workleap/webpack-configs` is pinned to `1.6.16`, the last release accepting that range. Applications using `webpack` 5.112 must downgrade to 5.111.
