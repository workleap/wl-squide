---
order: 100
toc:
    depth: 2-3
---

# InMemoryLaunchDarklyClient

An in-memory implementation of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript).

## Reference

```ts
const client = new InMemoryLaunchDarklyClient(featureFlags, options?: { context?, notifier? })
```

### Parameters

- `featureFlags`: A map instance of feature flags.
- `options`: An optional object literal of options:
    - `context`: A LaunchDarkly SDK [context](https://launchdarkly.com/docs/sdk/features/context-config).
    - `notifier`: A `LaunchDarklyClientNotifier` instance.

### Methods

- Implements all the base methods of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript).
- `setFeatureFlags`: Update feature flags values.

## Usage

### Create an instance

```ts !#7
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = {
    "show-characters": true
};

const client = new InMemoryLaunchDarklyClient(featureFlags);
```

### Provide a context

By default client context is `{ kind: "user", anonymous: true }`. To customize the context, provide a `context` option.

```ts !#8-20
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = {
    "show-characters": true
};

const client = new InMemoryLaunchDarklyClient(featureFlags, {
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

```ts !#10-13
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = {
    "show-characters": true,
    "render-summary": true
};

const client = new InMemoryLaunchDarklyClient(featureFlags);

client.setFeatureFlags({
    "show-characters": true,
    "render-summary": false
});
```

