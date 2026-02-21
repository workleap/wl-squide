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
    return (data, flags) => {
        if (flags.showAdminPanel) {
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

## Key APIs

- `useDeferredRegistrations()` — hook to trigger deferred phase
- `mergeDeferredRegistrations()` — utility to combine deferred data

## Relevant Source

- `packages/firefly/src/` — deferred registration logic
- User docs: `docs/essentials/`, `docs/reference/registration/`

---
*See [ARCHITECTURE.md](../../../ARCHITECTURE.md) for full context.*
