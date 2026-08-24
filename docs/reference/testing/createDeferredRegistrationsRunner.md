---
order: -100
toc:
    depth: 2-3
---

# createDeferredRegistrationsRunner

Create a runner executing [deferred registration](../registration/initializeFirefly.md#defer-the-registration-of-navigation-items) functions through the same sequence as a real application (strictly for testing purpose).

!!!warning
This function is for tests only. To update the deferred registrations of a running application, use the [useDeferredRegistrations](../registration/useDeferredRegistrations.md) hook. A runner doesn't notify React that the registrations changed, therefore an application driven by a runner would render stale navigation items.
!!!

## Reference

```ts
const runner = createDeferredRegistrationsRunner(runtime, localModules: [], options?: { context? })
```

### Parameters

- `runtime`: A [FireflyRuntime](../runtime/FireflyRuntime.md) instance.
- `localModules`: An array of module registration functions.
- `options`: An optional object literal of options:
    - `context`: An optional context object forwarded to the module registration functions.

### Returns

An object literal with the following functions:

- `register(data?)`: Register the modules, then execute their deferred registration functions with the `"register"` operation. Can only be called once. Returns a `Promise` object resolving to an array of `ModuleRegistrationError`.
- `update(data?)`: Execute the deferred registration functions again with the `"update"` operation, as a transactional run. Must be called after `register`. Returns a `Promise` object resolving to an array of `ModuleRegistrationError`.

An update run drops the deferred navigation items of the previous run and replays only what the current run registers. It also dispatches the `DeferredRegistrationsUpdateStartedEvent` and `DeferredRegistrationsUpdateCompletedEvent` events, because modules do listen to those events to reset their per run state.

## Usage

### Create a runner

```ts !#13
import { createDeferredRegistrationsRunner } from "@squide/firefly/testing";
import { FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";

const register: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = runtime => {
    return (deferredRuntime, data) => {
        if (data.isBillingEnabled) {
            deferredRuntime.registerNavigationItem({ $id: "billing", $label: "Billing", to: "/billing" });
        }
    };
};

const runtime = new FireflyRuntime();
const runner = createDeferredRegistrationsRunner(runtime, [register]);
```

### Execute a registration run

```ts !#1
await runner.register({ isBillingEnabled: true });

expect(runtime.getNavigationItems().length).toBe(1);
```

### Execute an update run

An update run reproduces what happens when a feature flag or the session changes:

```ts !#3
await runner.register({ isBillingEnabled: true });

await runner.update({ isBillingEnabled: false });

expect(runtime.getNavigationItems().length).toBe(0);
```

### Test multiple modules

Deferred registration defects usually involve more than one module. Provide every module participating in the scenario, as they all execute within the same run:

```ts !#15
const registerSection: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = () => {
    return (runtime, data) => {
        if (data.isBillingEnabled) {
            runtime.registerNavigationItem({ $id: "billing", $label: "Billing", children: [] });
        }
    };
};

const registerNestedItem: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = () => {
    return runtime => {
        runtime.registerNavigationItem({ $id: "invoices", $label: "Invoices", to: "/invoices" }, { sectionId: "billing" });
    };
};

const runner = createDeferredRegistrationsRunner(runtime, [registerSection, registerNestedItem]);
```

### Handle registration errors

Errors are collected rather than thrown, matching what a real registration run does:

```ts !#1
const errors = await runner.update({ isBillingEnabled: true });

expect(errors.length).toBe(0);
```

### Test a standalone deferred registration function

When a test targets a deferred registration function rather than a module, wrap the function into a module registration function:

```ts !#5
const registerBillingNavigationItems: DeferredRegistrationFunction<FireflyRuntime, FeatureFlags> = (runtime, data) => {
    // ...
};

const runner = createDeferredRegistrationsRunner(runtime, [() => registerBillingNavigationItems]);
```

### Provide a context

```ts !#2
const runner = createDeferredRegistrationsRunner(runtime, [register], {
    context: { host: "sample" }
});
```

### Validate the registrations

Navigation items registered under a section that no longer exists are parked as pending rather than rejected. Use `_validateRegistrations` to assert that a run didn't leave any pending registration behind:

```ts !#3
await runner.update({ isBillingEnabled: true });

expect(() => runtime._validateRegistrations()).not.toThrow();
```
