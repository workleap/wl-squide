---
"@squide/core": minor
---

`Plugin` gained an optional readiness surface: `isReady()`, `addReadyListener(callback)` and `removeReadyListener(callback)`, plus the exported `PluginReadyListener` type. A plugin implements it when it performs asynchronous work the application must wait for before rendering, such as the `i18nextPlugin` loading the resources of the current language. Readiness is a one-way latch and the listeners fire once, when the latch flips, therefore a consumer must read `isReady()` before subscribing. A plugin that doesn't implement the surface is always considered ready.

`ModuleManager.registerModulesRegisteredListener` and `ModuleManager.registerModulesReadyListener` are renamed `addModulesRegisteredListener` and `addModulesReadyListener`, matching the `add…Listener` / `remove…Listener` naming of `MswState`, `FeatureFlagSetSnapshot` and the readiness surface above. Only the name changes. These methods are framework-internal and undocumented; an application calling them directly must rename the calls:

```diff
- runtime.moduleManager.registerModulesRegisteredListener(callback);
+ runtime.moduleManager.addModulesRegisteredListener(callback);
- runtime.moduleManager.registerModulesReadyListener(callback);
+ runtime.moduleManager.addModulesReadyListener(callback);
```

`ModuleManager.addModuleRegistry` now attaches the listeners added with `addModulesRegisteredListener` and `addModulesReadyListener` to a registry added afterwards. Previously a listener added before the registry was never notified of that registry's status changes, and since both checks require every registry, the listener never fired.
