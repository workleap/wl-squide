---
order: 180
toc:
    depth: 2-3
---

# useFeatureFlag

Retrieve the value of a [LaunchDarkly](https://launchdarkly.com/) feature flag.

## Reference

```ts
const value = useFeatureFlag(key, defaultValue?)
```

### Parameters

- `key`: The key of the feature flag to retrieve the value for.
- `defaultValue`: An optional value to return if the feature flag is not available.

### Returns

The feature flag value or the `defaultValue` if the feature flag is not available.

## Usage

If the `foo` feature flag is not available, `true` will be returned.

```ts !#3
import { useFeatureFlag } from "@squide/firefly";

const value = useFeatureFlag("foo", true);
```
