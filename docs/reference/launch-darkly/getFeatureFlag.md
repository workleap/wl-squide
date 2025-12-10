---
order: 120
toc:
    depth: 2-3
---

# getFeatureFlag

Retrieve the value of a [LaunchDarkly](https://launchdarkly.com/) feature flag.

## Reference

```ts
const value = getFeatureFlag(launchDarklyClient, key, defaultValue?)
```

### Parameters

- `launchDarklyClient`: A LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) instance that is [ready](https://launchdarkly.com/docs/sdk/client-side/javascript#determine-when-the-client-is-ready).
- `key`: The key of the feature flag to retrieve the value for.
- `defaultValue`: An optional value to return if the feature flag is not available.

### Returns

The feature flag value or the `defaultValue` if the feature flag is not available.

## Usage

If the `foo` feature flag is not available, `true` will be returned.

```ts !#3
import { getFeatureFlag } from "@squide/firefly";

const value = getFeatureFlag(launchDarklyClient, "foo", true);
```
