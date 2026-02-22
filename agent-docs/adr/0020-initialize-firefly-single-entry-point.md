# ADR-0020: `initializeFirefly` as Single Entry Point

## Status

accepted

## Context

Bootstrapping a Squide application originally required multiple imperative function calls coordinated by the consumer: `new FireflyRuntime(...)`, `await registerLocalModules(runtime, [...])`, `await registerRemoteModules(runtime, [...])`, and `setMswAsReady()`. This was error-prone — consumers had to handle async coordination, MSW startup timing, and error handling manually. The API evolved through four iterations:

1. **v8** (separate functions): `new FireflyRuntime()` + `registerLocalModules()` + `registerRemoteModules()` + `setMswAsReady()` — four async operations coordinated by the consumer.
2. **v9.3** (async bootstrap): `bootstrap(runtime, { localModules, remotes, startMsw })` — consolidated registration but runtime still created separately, and the function was async.
3. **v11.0** (sync bootstrap): `bootstrap()` became synchronous — registration starts immediately, MSW readiness is awaited internally.
4. **v12.0** (initializeFirefly): `initializeFirefly({ localModules, ... })` — creates and returns the runtime, one call replaces everything.

## Options Considered

1. **Keep separate registration functions** — Explicit but verbose, requires consumer-managed coordination.
2. **Builder pattern** — `FireflyRuntime.builder().withModules(...).withMsw().build()`. Fluent API but unfamiliar in the React ecosystem.
3. **Declarative configuration via React provider** — Pass everything as props. Limits programmatic control.
4. **Single `initializeFirefly` function** — One synchronous call that creates the runtime, registers all modules, and handles MSW startup.

## Decision

Option 4. `initializeFirefly` accepts all configuration and returns the `FireflyRuntime` instance. The function performs the following operations in sequence:

1. **Enforces single execution** — A `hasExecuted` module-level guard throws if the function is called twice ("A squide application can only be initialized once"). A `__resetHasExecutedGuard()` is exported for tests only.
2. **Registers built-in plugins conditionally** — `MswPlugin` if `useMsw: true`, `LaunchDarklyPlugin` if `launchDarklyClient` is provided. `EnvironmentVariablesPlugin` is always created (ADR-0008).
3. **Creates the `FireflyRuntime` instance** — With all plugins (built-in + consumer-provided) merged.
4. **Logs initialization state** — Mode, modules, MSW usage, env vars, Honeycomb, LaunchDarkly, and plugins.
5. **Initializes Honeycomb tracing** — Async, non-blocking.
6. **Bootstraps modules** — Dispatches `ApplicationBootstrappingStartedEvent`, calls `runtime.moduleManager.registerModules()` with all module definitions merged, starts MSW if enabled, calls `onError` for any registration errors.
7. **Returns the runtime** — Synchronously, even though MSW and Honeycomb initialization continue in the background.

The function accepts two module input styles: `localModules` (plain registration functions, the common case) and `moduleDefinitions` (objects with `definition` + `registryId`, the advanced case). Both are merged internally: `[...moduleDefinitions, ...toLocalModuleDefinitions(localModules)]`. The `@squide/firefly-module-federation` package provides its own `initializeFirefly` wrapper that additionally accepts `remotes` and adds `ModuleFederationPlugin` to the plugins array (ADR-0007).

Evidence: `packages/firefly/src/initializeFirefly.ts` (lines 140-204) implements the full function. `packages/firefly/tests/initializeFirefly.test.ts` (lines 9-15) tests the `hasExecuted` guard. `docs/updating/migrate-to-firefly-v12.0.md` (lines 22-85) documents the evolution from `bootstrap` to `initializeFirefly`. `docs/updating/migrate-from-v8-to-v15.0.md` (lines 25-43) provides the aggregated timeline.

## Consequences

- One function call replaces four. No async coordination needed by the consumer.
- The `hasExecuted` guard prevents accidental double-initialization (e.g., React Strict Mode re-rendering the root).
- The runtime is guaranteed to be correctly initialized — consumers cannot create it in an inconsistent state.
- MSW startup is handled automatically based on the `useMsw` option. The `waitForMsw` prop was removed from `AppRouter` since `initializeFirefly` already knows whether MSW is enabled.
- The `moduleDefinitions` vs. `localModules` distinction allows the Module Federation wrapper to inject remote modules without changing the base function's API.
