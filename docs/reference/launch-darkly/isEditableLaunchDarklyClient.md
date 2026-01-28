---
order: 70
toc:
    depth: 2-3
---

# isEditableLaunchDarklyClient

Determine whether a LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) is editable, meaning that it exposes methods to modify feature flags such as `setFeatureFlags`.

## Reference

```ts
const isEditable = isEditableLaunchDarklyClient(launchDarklyClient)
```

### Parameters

- `launchDarklyClient`: A LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) instance that is [ready](https://launchdarkly.com/docs/sdk/client-side/javascript#determine-when-the-client-is-ready).

### Returns

A boolean indicating whether the LaunchDarkly client is editable.

## Usage

If you are using an editable LaunchDarkly client implementation such as the [InMemoryLaunchDarklyClient](./InMemoryLaunchDarklyClient.md) or the [LocalStorageLaunchDarklyClient](./LocalStorageLaunchDarklyClient.md), the `isEditableLaunchDarklyClient` function can be utilize to safely check if the client supports modifying feature flags at runtime.

```ts !#8
import { isEditableLaunchDarklyClient, useFeatureFlag, useLaunchDarklyClient } from "@squide/firefly";
import { useCallback } from "react";

const enabled = useFeatureFlag("show-characters", false);
const launchDarklyClient = useLaunchDarklyClient();

const handleChange = useCallback(() => {
    if (isEditableLaunchDarklyClient(launchDarklyClient)) {
        launchDarklyClient.setFeatureFlags({
            "show-characters": !enabled,
        });
    }
}, [enabled, launchDarklyClient]);
```
