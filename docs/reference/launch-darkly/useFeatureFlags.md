---
order: 160
toc:
    depth: 2-3
---

# useFeatureFlags

Retrieve all the [LaunchDarkly](https://launchdarkly.com/) feature flags.

## Reference

```ts
const flags = useFeatureFlags()
```

### Parameters

None

### Returns

A set of feature flags.

> While the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) returns a new object on every invocation, this hook returns a memoized feature flags object that only changes when a feature flag value is updated.

## Usage

```ts !#3
import { useFeatureFlags } from "@squide/firefly";

const flags = useFeatureFlags();
```
