# ADR-0002: Centralized FireflyRuntime Object

## Status

accepted

## Context

Modules need access to multiple services: route registration, navigation, event bus, logging, plugins, environment variables, feature flags, MSW state, and the AppRouter store. These services must be available during both registration and rendering phases. Early versions used a class named `AbstractRuntime`, which was renamed to `Runtime` in `@squide/core` v3.0.0 (PR #112) to simplify the naming since the class is already `abstract` by keyword.

The runtime grew through a three-layer inheritance chain: `Runtime` (core: module manager, logger, event bus, plugins) → `ReactRouterRuntime` (route registry, navigation item registry) → `FireflyRuntime` (AppRouter store, Honeycomb client, MSW state, environment variables, LaunchDarkly). Each layer adds capabilities specific to its domain.

## Options Considered

1. **Dependency injection container** — Formal DI (e.g., inversify, tsyringe). Powerful but adds complexity and a learning curve unfamiliar in the React ecosystem.
2. **Individual service parameters** — Pass each service separately to module register functions. Explicit but verbose and fragile to API changes — adding a new service would require changing every module's registration signature.
3. **Single runtime object with scoped proxy** — One `FireflyRuntime` instance serves as the hub for all services. Modules receive a `RuntimeScope` proxy that delegates to the real runtime but restricts access to sensitive operations and injects a scoped logger.

## Decision

Option 3. A single `FireflyRuntime` instance is created by `initializeFirefly` (ADR-0020) and serves as the centralized service hub. During module registration, each module receives a `RuntimeScope` (not the raw runtime) that throws on 5 restricted operations: `moduleManager` access, `startDeferredRegistrationScope`, `completeDeferredRegistrationScope`, `startScope`, and `_validateRegistrations`. `FireflyRuntimeScope` additionally restricts `appRouterStore` and `honeycombInstrumentationClient` access. All other operations (route registration, navigation, environment variables, feature flags, MSW, event bus, logging) are delegated through.

Evidence: `packages/core/src/runtime/Runtime.ts` (lines 160-245) defines `RuntimeScope` with restricted accessors. `packages/firefly/src/FireflyRuntime.tsx` extends `ReactRouterRuntime` with AppRouter store, Honeycomb, MSW state, environment variables, and LaunchDarkly. `packages/core/src/registration/LocalModuleRegistry.ts` (lines 81-82) creates scoped runtimes via `runtime.startScope(loggerScope)`.

## Consequences

- Simple module contract — every module receives one `runtime` object with a consistent API surface.
- No DI framework dependency.
- `FireflyRuntime` is a large class with many responsibilities (accepted tradeoff for API simplicity).
- The `RuntimeScope` proxy provides defense-in-depth: modules cannot access the module manager, start registration scopes, or read internal state like the AppRouter store.
- The scoped logger groups each module's registration log entries, making it easy to trace which module registered which routes and navigation items.
