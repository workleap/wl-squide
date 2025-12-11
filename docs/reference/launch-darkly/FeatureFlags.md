---
order: 190
toc:
    depth: 2-3
---

# FeatureFlags

The `FeatureFlags` interface defines the shape and types of the feature flags keys and values that modules evaluates through the [FireflyRuntime](../runtime/FireflyRuntime.md) instance and other utility hooks and functions.

Consumer applications are expected to [augment](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) this interface to declare the feature flags they intend to evaluate, providing a fully type-safe experience when working with feature flags.

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
├────── feature-flags.d.ts
```

Then create an `feature-flags.d.ts` file:

```ts !#6 project/types/feature-flags.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface FeatureFlags {
        // In the example above, the module only intends to evaliate the `show-characters` feature flag.
        "show-characters": boolean;
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
            "./types/feature-flags.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```

Any project that uses these feature flags must also reference the project's `feature-flags.d.ts` file:

```json !#5-7 project/tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
        "types": [
            "../another-project/types/feature-flags.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```



