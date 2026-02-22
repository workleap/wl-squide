# ADR-0020: `initializeFirefly` as Single Entry Point

## Status

accepted

## Context

Bootstrapping a Squide application originally required multiple imperative function calls coordinated by the consumer: `new FireflyRuntime(...)`, `await registerLocalModules(runtime, [...])`, `await registerRemoteModules(runtime, [...])`, and `setMswAsReady()`. This was error-prone — consumers had to handle async coordination, MSW startup timing, and error handling manually. The API evolved through several iterations (v9.3 `bootstrap`, v11 sync `bootstrap`, v12 `initializeFirefly`).

## Options Considered

1. **Keep separate registration functions** — Explicit but verbose, requires consumer-managed coordination.
2. **Builder pattern** — `FireflyRuntime.builder().withModules(...).withMsw().build()`. Fluent API but unfamiliar in the React ecosystem.
3. **Declarative configuration via React provider** — Pass everything as props. Limits programmatic control.
4. **Single `initializeFirefly` function** — One synchronous call that creates the runtime, registers all modules, and handles MSW startup.

## Decision

Option 4. `initializeFirefly` accepts all configuration (local modules, remote modules, plugins, MSW flag) and returns the `FireflyRuntime` instance. The function is synchronous — errors are handled via an `onError` callback. MSW readiness is managed internally.

Evidence: `docs/updating/migrate-to-firefly-v12.0.md` shows the evolution from `bootstrap` to `initializeFirefly`. The function additionally creates the runtime internally, ensuring correct initialization of internal state like `BootstrappingStore`.

## Consequences

- One function call replaces four. No async coordination needed.
- The runtime is guaranteed to be correctly initialized — consumers cannot create it in an inconsistent state.
- MSW startup is handled automatically based on the `useMsw` option.
- The `waitForMsw` prop was removed from `AppRouter` since `initializeFirefly` already knows whether MSW is enabled.
