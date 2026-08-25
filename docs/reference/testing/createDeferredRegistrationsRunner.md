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

An update run drops the deferred navigation items of the previous run and replays only what the current run registers. It also reproduces everything the [useDeferredRegistrations](../registration/useDeferredRegistrations.md) hook does around that run, because modules, plugins and third-party libraries rely on it to reset their per run state:

1. `DeferredRegistrationsUpdateStartedEvent` is dispatched.
2. The deferred registration functions are executed.
3. The app router store `deferredRegistrationsUpdatedAt` value is updated and `DeferredRegistrationsUpdatedEvent` is dispatched.
4. `DeferredRegistrationsUpdateCompletedEvent` is dispatched.

## Usage

### Create a runner

```ts !#16
import { createDeferredRegistrationsRunner } from "@squide/firefly/testing";
import { EnvironmentVariablesPlugin, FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";

const register: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = runtime => {
    return (deferredRuntime, data) => {
        if (data.isBillingEnabled) {
            deferredRuntime.registerNavigationItem({ $id: "billing", $label: "Billing", to: "/billing" });
        }
    };
};

const runtime = new FireflyRuntime({
    plugins: [x => new EnvironmentVariablesPlugin(x)]
});

const runner = createDeferredRegistrationsRunner(runtime, [register]);
```

!!!warning
A runner takes a runtime rather than creating one, and [initializeFirefly](../registration/initializeFirefly.md) cannot be used in tests because it can only be executed once per process. Construct the runtime with the plugins the modules under test depend on: `initializeFirefly` always registers an `EnvironmentVariablesPlugin`, so a module calling `registerEnvironmentVariable` or `getEnvironmentVariable` fails against a plugin less runtime.
!!!

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

### Test a module reacting to an update run

A module keeping state across its registrations usually resets that state when an update run starts. Since a runner dispatches the update events, the module reacts exactly as it would at runtime:

```ts !#6
import { DeferredRegistrationsUpdateStartedEvent } from "@squide/firefly";

const register: ModuleRegisterFunction<FireflyRuntime, unknown, Reports> = runtime => {
    const registeredReports = new Set<string>();

    runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => registeredReports.clear());

    return (deferredRuntime, data) => {
        data.categories.forEach(category => {
            category.reports.forEach(report => {
                // The same report can appear in several categories, and a link is never deduplicated.
                if (registeredReports.has(report.id)) {
                    return;
                }

                registeredReports.add(report.id);

                deferredRuntime.registerNavigationItem({ $id: report.id, $label: report.label, to: `/reports/${report.id}` });
            });
        });
    };
};
```

```ts !#4
const runner = createDeferredRegistrationsRunner(runtime, [register]);

await runner.register(reports);
await runner.update(reports);

expect(runtime.getNavigationItems().length).toBe(2);
```

Without the listener, the set still holds every identifier from the first run, so the update run registers nothing and the menu empties.

!!!tip
A navigation **section** needs no such guard. Declaring one that is already registered for the menu is [supported](../../essentials/register-nav-items.md#declare-a-section-from-multiple-modules) and contributes nothing, so a module can declare its section on every run and on every item.
!!!

!!!warning
A runner dispatches the update events itself, standing in for the [useDeferredRegistrations](../registration/useDeferredRegistrations.md) hook. Such a test asserts that a module reacts correctly to those events, not that they are dispatched at runtime. Squide covers that half.
!!!

### Handle registration errors

Errors are collected rather than thrown, matching what a real registration run does:

```ts !#1
const errors = await runner.register({ isBillingEnabled: true });

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

### Assert that no registration is pending

Navigation items registered under a section that no longer exists are parked as pending rather than rejected, so a run that lost a section still resolves without errors. Assert on the resulting navigation items to catch it:

```ts !#5
await runner.register({ isBillingEnabled: true });

await runner.update({ isBillingEnabled: true });

expect(runtime.getNavigationItems()).toMatchObject([{ $id: "billing", children: [{ $id: "invoices" }] }]);
```

!!!warning
Prefer asserting on the navigation items over `runtime._validateRegistrations()`. That function validates routes before navigation items, and routes registered without an explicit parent default to the `PublicRoutes` and `ProtectedRoutes` outlets, which are registered by the application's router rather than by a runner. Against a headless runtime it therefore throws `The ProtectedRoutes outlet is missing from the router configuration` for any module registering a route, whatever the state of the navigation items.
!!!
