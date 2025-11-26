---
order: 90
toc:
    depth: 2-3
---

# EnvironmentVariables

The `EnvironmentVariables` interface defines the shape and types of the environment-variable keys and values that modules register and access through the [FireflyRuntime](../runtime/FireflyRuntime.md) instance.

Consumer applications are expected to [augment](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) this interface to declare the variables they intend to register, providing a fully type-safe experience when working with environment variables.

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
├────── env-vars.d.ts
```

Then create an `env-vars.d.ts` file:

```ts !#6 project/types/env-vars.d.ts
import "@squide/firefly";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        // In the example above, the module only intends to register the `baseApiUrl` environment variable.
        baseApiUrl: string;
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
            "./types/env-vars.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```

Any project that uses these environment variables must also reference the project's `env-vars.d.ts` file:

```json !#5-7 project/tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
        "types": [
            "../another-project/types/env-vars.d.ts"
        ]
    },
    "exclude": ["dist", "node_modules"]
}
```



