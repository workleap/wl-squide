---
"@squide/core": patch
---

Replaced `Object.groupBy` with a `Map` in `ModuleManager.registerModules`.

`Object.groupBy` requires Chrome/Edge 117+, Safari 17.4+ and Firefox 119+. It ran during `initializeFirefly`, so any consumer on an older browser got `TypeError: Object.groupBy is not a function` before the first paint — a blank screen rather than a degraded one. Chrome/Edge 109 is the last version available on Windows 7, 8 and 8.1, and it is still within the range resolved by `@workleap/browserslist-config`.

Library builds are not polyfilled, and consumer bundlers do not polyfill `node_modules` by default, so the published `dist` could not be rescued by the host application.

A `Map` is used rather than a plain object because `Object.groupBy` returns a `null` prototype object. Grouping into an object literal would resolve inherited keys such as `constructor` or `toString` to a function instead of `undefined`, which would reach the same `.map()` call and throw the same kind of error for a registry named after one of them.
