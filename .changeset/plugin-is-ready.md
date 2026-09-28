---
"@squide/core": minor
---

`Plugin` gained optional members: `isReady()`, `registerReadyListener(callback)` and `removeReadyListener(callback)`, plus the exported `PluginReadyListener` type. A plugin implements them when it performs asynchronous work the application must wait for before rendering, such as the `i18nextPlugin` loading the resources of a language. `isReady()` is a status: it returns `false` again when new work starts and `true` once it settles, and the listeners are executed on every transition to ready. A plugin that doesn't implement them is always considered ready.

`ModuleManager.addModuleRegistry` now attaches the listeners registered with `registerModulesRegisteredListener` and `registerModulesReadyListener` to a registry added afterwards. Previously a listener registered before the registry was added was never notified of that registry's status changes, and since both checks require every registry, the listener never fired.

`ModuleManager.getAreModulesRegistered()` and `getAreModulesReady()` no longer report `true` while a registry hasn't started registering. A registry without modules settles synchronously before the next registry starts, and a listener subscribed from a plugin constructor was notified in between, before the remote modules of an application without local modules had registered anything. `ModuleManager.addModuleRegistry` throws once the registration has started, a registry added afterwards would never be started.
