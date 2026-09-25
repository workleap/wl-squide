---
"@squide/firefly": minor
---

`useIsBootstrapping` now waits for the plugins implementing the new `Plugin` readiness surface (`isReady()`, `addReadyListener()`, `removeReadyListener()`) to be ready, on the normal path and on the 401 path alike. The `AppRouter` state gained an `arePluginsReady` flag set by a new `plugins-ready` action, mirrored to the `AppRouterStore` and dispatched on the event bus as `PluginsReadyEvent` (`"squide-plugins-ready"`). The Honeycomb bootstrapping span gained a matching `plugins-ready` event.

There is no behavior change for an application whose plugins don't implement the surface: `arePluginsReady` is initially `true` and neither the action nor the event is dispatched.
