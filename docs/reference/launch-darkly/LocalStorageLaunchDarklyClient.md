---
order: 100
toc:
    depth: 2-3
---

# LocalStorageLaunchDarklyClient

A local storage implementation of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) for use in dev environments. This is a great way to persist feature flags in a msw-powered dev environment.

It can be created using the `createLocalStorageLaunchDarklyClient` factory function.

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

## Usage

### Create an instance

When you want to create an instance of `LocalStorageLaunchDarklyClient`, you need to provide a `storageKey` and a set of `defaultFeatureFlags` to the `createLocalStorageLaunchDarklyClient` function.

```ts !#7
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const defaultFeatureFlags = new Map([
    ["show-characters", true]
] as const);

const client = createLocalStorageLaunchDarklyClient("my-storage-key", defaultFeatureFlags);
```

### Update the local storage flags

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

### Customize the context

By default client context is `{ kind: "user", anonymous: true }`. To customize the context, provide a `context` option.

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

