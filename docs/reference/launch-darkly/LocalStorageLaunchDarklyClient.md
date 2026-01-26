---
order: 90
toc:
    depth: 2-3
---

# LocalStorageLaunchDarklyClient

An implementation of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) that persist the feature flags in local storage.

## Reference

```ts
const client = createLocalStorageLaunchDarklyClient(storageKey, defaultFeatureFlags, options?: { context?, notifier? })
```

### Parameters

- `storageKey`: The key to use when storing feature flags in `localStorage`.
- `defaultFeatureFlags`: A map instance representing the default feature flags if they are not found in `localStorage`.
- `options`: An optional object literal of options:
    - `context`: A LaunchDarkly SDK [context](https://launchdarkly.com/docs/sdk/features/context-config).
    - `notifier`: A `LaunchDarklyClientNotifier` instance.

### Methods

- Implements all the base methods of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript).
- `setFeatureFlags`: Add new feature flags or update existing feature flags values.

## Usage

### Create an instance

To create an instance of `LocalStorageLaunchDarklyClient`, provide a `storageKey` and a set of `defaultFeatureFlags` to the `createLocalStorageLaunchDarklyClient` function. The local storage will be immediatly initialize with the provided `defaultFeatureFlags`.

```ts !#7
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const defaultFeatureFlags = new Map([
    ["show-characters", true]
] as const);

const client = createLocalStorageLaunchDarklyClient("my-storage-key", defaultFeatureFlags);
```

### Customize the context

By default client context is `{ kind: "user", anonymous: true }`. To customize the context, provide a `context` option at creation.

```ts !#7-21
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const defaultFeatureFlags = new Map([
    ["show-characters", true]
] as const);

const client = createLocalStorageLaunchDarklyClient("my-storage-key", defaultFeatureFlags, {
    context: {
        kind: "multi",
        user: {
            key: "user-123",
            name: "Sandy",
            email: "sandy@example.com"
        },
        org: {
            key: "org-456",
            name: "Acme Inc",
            plan: "enterprise"
        }
    }
});
```

### Update flags value

To update the initial feature flags, use the `setFeatureFlags` method.

```ts !#10-13
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const defaultFeatureFlags = new Map([
    ["show-characters", true],
    ["render-summary", true]
] as const);

const client = createLocalStorageLaunchDarklyClient("my-storage-key", defaultFeatureFlags);

client.setFeatureFlags({
    "show-characters": true,
    "render-summary": false
});
```

