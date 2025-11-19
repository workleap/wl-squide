---
order: -100
toc:
    depth: 2-3
---

# mergeDeferredRegistrations

Utility function that takes an array of [deferred registration](./initializeFirefly.md#defer-the-registration-of-navigation-items) functions and returns a single function wrapping and merging all the provided deferred registration functions.

If the provided array contains `undefined` values, they will safely be ignored.

## Reference

```ts
const registrations = mergeDeferredRegistrations(candidates: []);
```

### Parameters

- `candidates`: An array of [deferred registration](./initializeFirefly.md#defer-the-registration-of-navigation-items) functions.

### Returns

A function or `undefined`:

- If multiple deferred registration functions are provided, a single function wrapping and merging all the provided deferred registration functions is returned.
- If a single deferred registration function is provided, the provided function is returned.
- If no deferred registration functions are provided, `undefined` is returned.

## Usage

```tsx !#10-14 host/src/register.tsx
import { mergeDeferredRegistrations, type ModuleRegisterFunction, type FireflyRuntime } from "@squide/firefly";
import { registerLayouts } from "./registerLayouts.tsx";
import { registerAppShell } from "./registerAppShell.tsx";

function registerRoutes(runtime: FireflyRuntime) {
    // ...
}

export const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    return mergeDeferredRegistrations([
        await registerLayouts(runtime),
        await registerAppShell(runtime),
        registerRoutes(runtimet)
    ]);
}
```
