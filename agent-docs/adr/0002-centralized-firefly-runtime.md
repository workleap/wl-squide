# ADR-0002: Centralized FireflyRuntime Object

## Status

accepted

## Context

Modules need access to multiple services: route registration, navigation, event bus, logging, plugins, environment variables, feature flags, MSW state, and the AppRouter store. These services must be available during both registration and rendering phases.

## Options Considered

1. **Dependency injection container** — Formal DI (e.g., inversify, tsyringe). Powerful but adds complexity and a learning curve.
2. **Individual service parameters** — Pass each service separately to module register functions. Explicit but verbose and fragile to API changes.
3. **Single runtime object** — One `FireflyRuntime` instance serves as the hub for all services.

## Decision

Option 3. A single `FireflyRuntime` (inheriting `ReactRouterRuntime` → `Runtime`) owns all services. Modules receive a `RuntimeScope` proxy that delegates to the real runtime but restricts access to sensitive operations and injects a scoped logger.

Evidence: `packages/core/src/runtime/Runtime.ts` owns module manager, logger, event bus, and plugins. `packages/firefly/src/FireflyRuntime.tsx` adds AppRouter store, Honeycomb, MSW state, env vars, and LaunchDarkly.

## Consequences

- Simple module contract — every module receives one `runtime` object.
- No DI framework dependency.
- `FireflyRuntime` is a large class with many responsibilities (accepted tradeoff).
- The `RuntimeScope` proxy provides defense-in-depth: modules cannot access module manager or start registration scopes.
