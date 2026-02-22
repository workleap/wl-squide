# ADR-0001: Two-Phase Registration with Frozen Routes

## Status

accepted

## Context

Squide modules need to register routes and navigation items. Some registrations depend on runtime data (feature flags, user permissions) that isn't available at bootstrap. However, dynamically adding/removing routes after initial registration creates complexity — React Router's data model assumes a stable route tree.

## Options Considered

1. **Full dynamic routing** — Allow routes to be added/removed at any time. Complex, risk of breaking React Router internals.
2. **Static-only registration** — All registrations happen once at bootstrap. Simpler but cannot adapt to runtime data.
3. **Two-phase registration** — Phase 1 registers routes and navigation statically at bootstrap. Phase 2 (deferred) allows only navigation items to be re-registered when data/flags change.

## Decision

Option 3. Routes are frozen after Phase 1 (`registerRoute()` throws if called after modules are registered). Deferred registration callbacks can only register navigation items.

Evidence: `packages/firefly/src/FireflyRuntime.tsx` throws "Only navigation items can be registered in a deferred registration function." The deferred function receives an `operation` parameter (`"register" | "update"`) to distinguish initial vs. subsequent runs.

## Consequences

- The route tree is stable after bootstrap, avoiding dynamic routing complexity.
- Navigation items can adapt to feature flags, permissions, and fetched data.
- Modules that need conditional routes must register all possible routes in Phase 1 and control visibility through navigation items or guards.
