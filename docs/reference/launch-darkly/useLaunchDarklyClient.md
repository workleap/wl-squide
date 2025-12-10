---
order: 140
toc:
    depth: 2-3
---

# useLaunchDarklyClient

Retrieve the LaunchDarkly SDK [client](https://launchdarkly.com/docs/sdk/client-side/javascript) instance provided at [initialization](../registration/initializeFirefly.md).

## Reference

```ts
const client = useLaunchDarklyClient()
```

### Parameters

None

### Returns

A LaunchDarkly SDK client instance.

## Usage

```ts !#3
import { useLaunchDarklyClient } from "@squide/firefly";

const client = useLaunchDarklyClient();
```
