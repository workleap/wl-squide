---
"@squide/msw": minor
"@squide/launch-darkly": minor
"@squide/firefly": minor
---

Aligned the listener registration methods on the `register…Listener` / `remove…Listener` naming used by `ModuleManager`, `Runtime` and `i18nextPlugin`. The previous names are kept as deprecated aliases, the behavior is identical:

- `MswState.addMswReadyListener` is deprecated in favor of `registerMswReadyListener`.
- `FeatureFlagSetSnapshot.addSnapshotChangedListener` is deprecated in favor of `registerSnapshotChangedListener`.

The event bus `addListener` / `removeListener` methods are unchanged.
