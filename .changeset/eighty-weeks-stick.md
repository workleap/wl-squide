---
"@squide/launch-darkly": patch
---

- `InMemoryLaunchDarklyClient` now support updating feature flags at runtime via `setFeatureFlags` methods.
- `InMemoryLaunchDarklyClient` now automatically notifies subscribers of feature flag changes using `LaunchDarklyClientNotifier`.
- Added `LocalStorageLaunchDarklyClient`, an implementation that persist feature flags to the local storage.
- Bumped dependencies.

