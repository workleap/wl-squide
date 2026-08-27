# Deferred Registrations

## Overview

Squide uses a **two-phase registration** system that allows modules to conditionally register
routes and navigation items based on runtime data (user permissions, feature flags, etc.).

## How It Works

1. **Phase 1 (initial)** — the module's register function runs at bootstrap, registering
   routes and navigation items that are always present.

2. **Phase 2 (deferred)** — the register function returns a callback. This callback re-runs
   whenever global data or feature flags change, enabling conditional registrations.

```tsx
export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    // Phase 1: always registered
    runtime.registerRoute({ path: "/dashboard", element: <Dashboard /> });

    // Phase 2: deferred, re-runs when data/flags change
    return (runtime, data, operation) => {
        if (data.role === "admin") {
            runtime.registerNavigationItem({
                $id: "admin",
                $label: "Admin",
                to: "/admin"
            });
        }
    };
};
```

## Triggers for Re-execution

Deferred registrations automatically re-execute when:
- `usePublicDataQueries` or `useProtectedDataQueries` return new data
- LaunchDarkly feature flag values change (streaming mode)

## Scope Boundaries

`ModuleManager` brackets **both** run paths with `runtime.startDeferredRegistrationScope()` / `completeDeferredRegistrationScope()` — `registerDeferredRegistrations` passes `{ operation: "register" }`, `updateDeferredRegistrations` passes `{ transactional: true, operation: "update" }`.

The start of that scope is exposed as a runtime listener, so an application registry filled from the same deferred registration functions (a command palette, a sitemap, a search index) can reset itself on every run. See [ADR-0032](../adr/0032-deferred-registration-scope-started-listener.md).

- `runtime.registerDeferredRegistrationScopeStartedListener(callback)` — returns a disposer
- `runtime.removeDeferredRegistrationScopeStartedListener(callback)`

The callback receives a `DeferredRegistrationOperation` (`"register" | "update"`). Fired after the scope is in place and before any deferred registration function runs, in registration order. A throwing listener is logged, never propagated — an escaping error would leave the scope open and break every subsequent run. Reachable from `RuntimeScope` too: observing the boundary is allowed even though starting or completing a scope is not.

The listener set and the public API live on `Runtime` (`packages/core`); the fan-out is triggered by `ReactRouterRuntime.startDeferredRegistrationScope` calling the protected `_notifyDeferredRegistrationScopeStarted`. **A new concrete runtime implementing scopes must call that helper**, or the API is silently inert for it.

There is no *completed* listener yet — deliberately deferred, see ADR-0032.

## Key APIs

- `useDeferredRegistrations()` — hook to trigger deferred phase
- `mergeDeferredRegistrations()` — utility to combine deferred data
- `runtime.registerDeferredRegistrationScopeStartedListener()` — observe the start of a run

## Relevant Source

- `packages/firefly/src/` — deferred registration logic
- User docs: `docs/essentials/`, `docs/reference/registration/`

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
