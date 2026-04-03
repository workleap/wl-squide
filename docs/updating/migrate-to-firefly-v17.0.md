---
order: 850
label: Migrate to firefly v17.0
toc:
    depth: 2-3
---

# Migrate to firefly v17.0

This major version introduces type-safe event bus hooks through [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) of the [EventMap](../reference/messaging/EventMap.md) interface. This follows the same pattern used by [EnvironmentVariables](../reference/env-vars/EnvironmentVariables.md) and [FeatureFlags](../reference/launch-darkly/FeatureFlags.md).

## Breaking changes

The `useEventBusDispatcher` and `useEventBusListener` hooks no longer accept generic type parameters. The `EventBus` class now only accepts event names that have been declared in the [EventMap](../reference/messaging/EventMap.md) interface. Passing an arbitrary string or using generic type parameters will result in a TypeScript error.

## Add event typings

First, create a types folder in the project:

``` !#7-8
project
├── src
├────── register.tsx
├────── Page.tsx
├────── index.tsx
├────── App.tsx
├── types
├────── event-map.d.ts
```

Then create an `event-map.d.ts` file:

```ts !#6 project/types/event-map.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface EventMap {
        // Each entry maps an event name to its payload type.
        "show-toast": string;
    }
}
```

Finally, update the project `tsconfig.json` to include the `types` folder:

```json !#5-7 project/tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
        "types": [
            "./types/event-map.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```

If any other project using those events must also reference the project's `event-map.d.ts` file:

```json !#5-7 project/tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
        "types": [
            "../another-project/types/event-map.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```

## Remove wrapper hooks

If you created wrapper hooks to pre-apply generic types, they can be simplified or removed:

Before:

```ts eventBus.ts
import { useEventBusDispatcher, useEventBusListener } from "@squide/firefly";

export type MessageTypes = "write-to-host" | "show-toast";

export const useApplicationEventBusDispatcher = useEventBusDispatcher<MessageTypes>;
export const useApplicationEventBusListener = useEventBusListener<MessageTypes>;
```

After:

```ts eventBus.ts
import { useEventBusDispatcher, useEventBusListener } from "@squide/firefly";

export const useApplicationEventBusDispatcher = useEventBusDispatcher;
export const useApplicationEventBusListener = useEventBusListener;
```

Or import `useEventBusDispatcher` and `useEventBusListener` directly from `@squide/firefly` and remove the wrapper file entirely.

## Remove type assertions in callbacks

With typed events, callback payloads are inferred and type assertions are no longer needed:

Before:

```ts
useApplicationEventBusListener("show-toast", callback as (message: unknown) => void);
```

After:

```ts
useEventBusListener("show-toast", callback);
```

For more details, refer to the [use the event bus](../essentials/use-event-bus.md) guide.
