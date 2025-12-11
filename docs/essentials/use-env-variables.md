---
order: 400
label: Use environment variables
---

# Use environment variables

Environment variables are incredibly useful when working with **multiple environments**, such as `dev`, `staging`, and `production` because they **decouple configuration** from **code**. This allows to change an application's behavior without modifying the code itself. A common example is the URLs of dedicated API services, where each environment uses a different URL.

By attaching environment variables to a [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance, rather than accessing `process.env` throughout the codebase, Squide supports a modular architecture and makes it easier to write tests and Storybook stories by isolating configuration from global state.

==- :icon-light-bulb: Why is using `process.env` problematic?
While accessing environment variables through `process.env` works, it comes with several drawbacks:

- **Not ideal for testing:** Mocking `process.env` for testing is cumbersome because it is a global variable. This often results in flaky tests, poor isolation, and unexpected side effects.
- **Not ideal for stories:** Mocking `process.env` in Storybook stories can also be cumbersome.
- **Not ideal for modular code:** Modules that rely on global variables are harder to load independently, reuse, or run in different host applications. This goes against modular design principles.
- **Couples the code to Node.js:** Many environments do not support `process.env`, including browsers, Web Workers, Service Workers, Cloudflare Workers, Vercel Edge Functions, Netlify Edge Functions, and Deno (unless running in Node-compatibility mode).
===

For more details, refer to the [reference](../reference/env-vars/EnvironmentVariablesPlugin.md) documentation.

## Register variables at initialization

If some environment variables are already available at startup, they can be provided directly when initializing Squide:

```ts
import { initializeFirefly } from "@squide/firefly";

const runtime = initializeFirefly({
    environmentVariables: {
        apiBaseUrl: "https://my-api.com",
        telemetryBaseUrl: "https://my-telemetry.com"
    }
});
```

## Register a variable

```ts !#4
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerVariable("apiBaseUrl", "https://my-api.com");
};
```

!!!tip
An environment variable with the same key can be registered multiple times (e.g., by multiple modules) as long as the value remains the same. If the value differs, an `Error` will be thrown.
!!!

## Register multiple variables at once

```ts !#4-7
import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerVariables({
        apiBaseUrl: "https://my-api.com",
        telemetryBaseUrl: "https://my-telemetry.com"
    });
};
```

## Retrieve a single variable

Using the [useEnvironmentVariable](../reference/env-vars/useEnvironmentVariable.md) hook:

```ts !#3
import { useEnvironmentVariable } from "@squide/firefly";

const variable = useEnvironmentVariable("apiBaseUrl");
```

Using the runtime instance:

```ts !#1
const variable = runtime.getEnvironmentVariable("apiBaseUrl");
```

## Retrieve all the variables

Using the [useEnvironmentVariables](../reference/env-vars/useEnvironmentVariables.md) hook:

```ts !#3
import { useEnvironmentVariables } from "@squide/firefly";

const variables = useEnvironmentVariables();
```

Using the runtime instance:

```ts !#1
const variables = runtime.environmentVariables;
```

## Setup the typings

Before registering variables, modules must [augment](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) the [EnvironmentVariables](../reference/env-vars/EnvironmentVariables.md) interface with the variables they intend to register to ensure type safety and autocompletion.

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

If any other project using those environment variables must also reference the project's `env-vars.d.ts` file:

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

## Setup with tests

If the code under test uses environment variables, the `FireflyRuntime` instance can be used to mock these variables.

Considering the following utility hook:

```ts !#4 ./src/useAbsoluteUrl.ts
import { useEnvironmentVariable } from "@squide/firefly";

export function useAbsoluteUrl(path: string) {
    const apiBaseUrl = useEnvironmentVariable("apiBaseUrl");

    return `${apiBaseUrl}/${path}`;
}
```

The following unit test can be written to mock the value of `apiBaseUrl` and test the ouput of the `useAbsoluteUrl` hook:

```tsx !#8-12,17,19 ./tests/useAbsoluteUrl.test.tsx
import { FireflyProvider, FireflyRuntime, EnvironmentVariablesPlugin } from "@squide/firefly";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAbsoluteUrl } from "../src/useAbsoluteUrl.ts";

test("an absolute URL including the API base URL is returned", () => {
    const runtime = new FireflyRuntime({
        plugins: [x => new EnvironmentVariablesPlugin({
            variables: {
                apiBaseUrl: "https://my-api.com"
            }
        })]
    });

    const { result } = renderHook(() => useAbsoluteUrl("bar"), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <FireflyProvider runtime={runtime}>
                {children}
            </FireflyProvider>
        )
    })

    expect(result).toBe("https://my-api.com/bar");
});
```

## Setup with Storybook

To set up [Storybook](https://storybook.js.org/docs) stories with environment variables, refer to the [setup Storybook](../integrations/setup-storybook.md#setup-environment-variables) integration guide.






