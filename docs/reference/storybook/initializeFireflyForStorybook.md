---
order: 100
toc:
    depth: 2-3
---

# initializeFireflyForStorybook

Create a runtime instance tailored for Storybook and optionally register **local** modules. 

## Reference

```ts
const runtime = initializeFireflyForStorybook(options?: { localModules?, environmentVariables? })
```

### Parameters

- `options`: An optional object literal of options:
    - `localModules`: An optional array of `ModuleRegisterFunction`.
    - `environmentVariables`: An optional object of environment variables.

### Returns

A `StorybookRuntime` instance.

## Usage

```ts !#3-8
import { initializeFireflyForStorybook } from "@squide/firefly-rsbuild-storybook";

const runtime = initializeFireflyForStorybook({
    localModules: [...],
    environmentVariables: {
        "foo": "bar"
    }
});
```
