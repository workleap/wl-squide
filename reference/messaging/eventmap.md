# EventMap

The `EventMap` interface defines the shape and types of the event names and payload values that modules dispatch and listen to through the [FireflyRuntime](../runtime/FireflyRuntime.md) instance event bus.

Consumer applications are expected to [augment](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) this interface to declare the events they intend to use, providing a fully type-safe experience when working with the event bus.

All Squide native events (bootstrapping lifecycle, data fetching, AppRouter state transitions) are pre-augmented and already type-safe. You only need to augment `EventMap` for your own application events.

## Augment the interface

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

Any project that uses these events must also reference the project's `event-map.d.ts` file:

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
