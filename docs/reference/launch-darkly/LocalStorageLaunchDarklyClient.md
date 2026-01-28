---
order: 90
toc:
    depth: 2-3
---

# LocalStorageLaunchDarklyClient

An implementation of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) that persist the feature flags in local storage.

## Reference

```ts
const client = createLocalStorageLaunchDarklyClient(defaultValues, options?: { localStorageKey?, context?, notifier? })
```

### Parameters

- `defaultValues`: An object literal of default values for the feature flags if they are not found in `localStorage`.
- `options`: An optional object literal of options:
    - `localStorageKey`: An optional local storage key to override the default one.
    - `context`: An optional LaunchDarkly SDK [context](https://launchdarkly.com/docs/sdk/features/context-config).
    - `notifier`: An optional `LaunchDarklyClientNotifier` instance.

### Methods

- Implements all the base methods of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript).
- `setFeatureFlags`: Update feature flags values.

## Usage

### Create an instance

To create an instance of `LocalStorageLaunchDarklyClient`, use the `createLocalStorageLaunchDarklyClient` function. The local storage will be immediatly initialize with the provided `defaultValues`.

```ts !#7
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const featureFlags = {
    "show-characters": true
};

const client = createLocalStorageLaunchDarklyClient(featureFlags);
```

### Provide a local storage key

To customize the local storage key, provide a `localStorageKey` option at creation.

```ts !#8
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const featureFlags = {
    "show-characters": true
};

const client = createLocalStorageLaunchDarklyClient(featureFlags, {
    localStorageKey: "abc123"
});
```

### Provide a context

By default client context is `{ kind: "user", anonymous: true }`. To customize the context, provide a `context` option at creation.

```ts !#7-21
import { createLocalStorageLaunchDarklyClient } from "@squide/firefly";

const featureFlags = {
    "show-characters": true
};

const client = createLocalStorageLaunchDarklyClient(featureFlags, {
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

const featureFlags = {
    "show-characters": true,
    "render-summary": true
};

const client = createLocalStorageLaunchDarklyClient(featureFlags);

client.setFeatureFlags({
    "show-characters": true,
    "render-summary": false
});
```

