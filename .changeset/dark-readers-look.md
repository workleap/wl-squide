---
"@squide/module-federation": major
"@squide/react-router": major
"@squide/firefly": major
"@squide/core": major
"@squide/msw": major
---

Deferred registration functions now receives a runtime instance as the first argument. This new scope runtime instance should used whenever runtime access is required within a deferred registration function scope.

Before:

The `runtime` argument of the registration function is used to register the navigation item.

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
