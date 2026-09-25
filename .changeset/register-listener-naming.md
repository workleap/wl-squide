---
"@squide/msw": minor
"@squide/launch-darkly": minor
"@squide/firefly": minor
---

Aligned the listener registration methods on the `register…Listener` / `remove…Listener` naming used by `ModuleManager`, `Runtime` and `i18nextPlugin`. Only the names change, the behavior is identical:

- `MswState.addMswReadyListener` is renamed `registerMswReadyListener`.
- `FeatureFlagSetSnapshot.addSnapshotChangedListener` is renamed `registerSnapshotChangedListener`.

Both classes are re-exported by `@squide/firefly`. An application calling these methods directly must rename the calls:

```diff
- runtime.mswState.addMswReadyListener(callback);
+ runtime.mswState.registerMswReadyListener(callback);
- snapshot.addSnapshotChangedListener(listener);
+ snapshot.registerSnapshotChangedListener(listener);
```

The event bus `addListener` / `removeListener` methods are unchanged.
