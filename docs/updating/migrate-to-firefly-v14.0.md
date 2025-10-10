---
order: 900
label: Migrate to firefly v14.0
toc:
    depth: 2-3
---

# Migrate to firefly v14.0

!!!warning
If you are migrating from `v8.*`, follow the [Migrate from v8.* to v15.0](./migrate-from-v8-to-v15.0.md) guide.
!!!

This major version introduces a new first argument to deferred registration functions. 

## Breaking changes

### New runtime instance argument for deferred registration function

A new first argument is provided to deferred registration functions: a scoped runtime instance.

This new scoped runtime instance argument **should be used whenever runtime access is required**, instead of the root runtime provided to module registration function.

_Reminder: A deferred registration function is a function returned by a module registration function and is executed later, once global data has been fetched. A common use case for deferred registrations is [conditionally rendering navigation items](../guides/register-a-conditional-nav-item.md)._

Placing the `runtime` argument first **is intentional**: it emphasizes that consumers should rely on this specific runtime within the deferred registration function scope, rather than the root runtime instance passed to the module registration function.

Before:

The `runtime` argument of the **registration** function is used to register the navigation item.

```ts !#1,2,4
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    return ({ featureFlags }, operation) => {
        if (featureFlags.featureA) {
            runtime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
```

After:

The `deferredRuntime` argument of the **deferred** registration function is used to register the navigation item.

```ts !#2,4
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = runtime => {
    return (deferredRuntime, { featureFlags }, operation) => {
        if (featureFlags.featureA) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: operation === "register" ? "Feature A" : "Feature A updated",
                to: "/feature-a"
            });
        }
    };
}
```

### New `@workleap/logging` peer dependency

This version also introduces `@workleap/logging` as a peer dependency.
