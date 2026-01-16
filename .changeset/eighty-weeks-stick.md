---
"@squide/launch-darkly": patch
---

InMemoryLaunchDarklyClient now support updating feature flags at runtime via setFeatureFlag and setFeatureFlags methods.
InMemoryLaunchDarklyClient now automatically notifies subscribers of feature flag changes using LaunchDarklyClientNotifier.
Added LocalStorageLaunchDarklyClient, an implementation of InMemoryLaunchDarklyClient that persists feature flags in localStorage.

