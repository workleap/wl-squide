---
order: 100
toc:
    depth: 2-3
---

# InMemoryLaunchDarklyClient

An in-memory implementation of the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) for use in [Storybook](https://storybook.js.org/) and test environments.

## Reference

```ts
const client = new InMemoryLaunchDarklyClient(featureFlags, options?: { context?, notifier? })
```

### Parameters

- `featureFlags`: A map instance of feature flags.
- `options`: An optional object literal of options:
    - `context`: A LaunchDarkly SDK [context](https://launchdarkly.com/docs/sdk/features/context-config).
    - `notifier`: A `LaunchDarklyClientNotifier` instance.

## Usage

### Create an instance

```ts !#7
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = new Map([
    ["show-characters", true]
] as const);

const client = new InMemoryLaunchDarklyClient(featureFlags);
```

### Update the in-memory flags

```ts !#11,14-16
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = new Map([
    ["show-characters", true],
    ["render-summary", true]
] as const);

const client = new InMemoryLaunchDarklyClient(featureFlags);

// Update a single flag
client.setFeatureFlag("show-characters", false);

// Update multiple flags
client.setFeatureFlags({
    "show-characters": true,
    "render-summary": false
});
```

### Customize the context

By default client context is `{ kind: "user", anonymous: true }`. To customize the context, provide a `context` option.

```ts !#8-20
import { InMemoryLaunchDarklyClient } from "@squide/firefly";

const featureFlags = new Map([
    ["show-characters", true]
] as const);

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

