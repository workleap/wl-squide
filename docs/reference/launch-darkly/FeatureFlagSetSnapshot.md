---
order: 110
toc:
    depth: 2-3
---

# FeatureFlagSetSnapshot

A class tracking and memoizing the latest version of the [LaunchDarkly](https://launchdarkly.com/) feature flags.

> The LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) returns a new object containing feature flags every time they're accessed. This class tracks flag updates and keeps an in-memory, memoized snapshot of the flags, returning the same object reference until a flag value changes.

## Reference

```ts
const snapshot = new FeatureFlagSetSnapshot(launchDarklyClient)
```

### Parameters

- `launchDarklyClient`: A LaunchDarkly SDK client instance that is [ready](https://launchdarkly.com/docs/sdk/client-side/javascript#determine-when-the-client-is-ready).

## Usage

### Create an instance

```ts !#3
import { FeatureFlagSetSnapshot } from "@squide/firefly";

const snapshot = new FeatureFlagSetSnapshot(launchDarklyClient);
```

### Retrieve the feature flags

```ts !#4
import { FeatureFlagSetSnapshot } from "@squide/firefly";

const snapshot = new FeatureFlagSetSnapshot(launchDarklyClient);
const flags = snapshot.value;
```

### Register a change listener

```ts !#5-7
import { FeatureFlagSetSnapshot } from "@squide/firefly";

const snapshot = new FeatureFlagSetSnapshot(launchDarklyClient);

snapshot.addSnapshotChangedListener((snapshot, changes) => {
    console.log(snapshot, changes);
});
```

### Remove a change listener

```ts !#10
import { FeatureFlagSetSnapshot } from "@squide/firefly";

const snapshot = new FeatureFlagSetSnapshot(launchDarklyClient);

const listener = (snapshot, changes) => {
    console.log(snapshot, changes);
};

snapshot.addSnapshotChangedListener(listener);
snapshot.removeSnapshotChangedListener(listener);
```
