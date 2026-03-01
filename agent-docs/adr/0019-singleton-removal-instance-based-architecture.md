# ADR-0019: Singleton Removal in Favor of Instance-Based Architecture

## Status

accepted

## Context

Squide originally used module-level singletons for state management across packages. For example, `MswState` was a module-level singleton, and the `module-federation` package maintained global registration state. This made it impossible to create multiple isolated runtime instances (e.g., for testing or Storybook), caused hidden coupling between packages, and made unit testing difficult because singleton state leaked between tests.

## Options Considered

1. **Keep module-level singletons** — Simple to access from anywhere, but untestable in isolation, prevents multiple runtime instances, and creates hidden global state.
2. **Dependency injection container** — A formal DI framework to manage instances. Over-engineered for the use case and adds a heavy abstraction.
3. **Instance-based state owned by the runtime** — All state lives on class instances (`MswState`, `MswPlugin`, `ModuleManager`, `RouteRegistry`, `NavigationItemRegistry`) that are created by and owned by the `FireflyRuntime`. React hooks subscribe to instance state changes via `useSyncExternalStore`.

## Decision

Option 3. All module-level singletons were removed in a single large refactor (commit `de6b3335f`, 192 files changed). State classes like `MswState`, `ModuleManager`, and registry classes are instantiated by `FireflyRuntime` and accessed through it. The `packages/module-federation` singleton-based package was replaced by `packages/firefly-module-federation` with a class-based `RemoteModuleRegistry`. React components subscribe to instance state via `useSyncExternalStore` (see ADR-0021).

Evidence: `packages/msw/src/MswState.ts` is a class with listener-based state (not a singleton). `packages/firefly/src/useStrictRegistrationMode.ts` uses `useSyncExternalStore` to subscribe to `runtime.moduleManager` instance state. The `de6b3335f` commit removed all singletons across the codebase.

## Consequences

- Multiple `FireflyRuntime` instances can coexist (critical for Storybook stories and test isolation).
- Unit tests are fully isolated — no singleton state leaks between test cases.
- All state is traceable through the runtime instance, improving debuggability.
- Slightly more verbose access patterns — state is accessed through the runtime rather than imported directly.
