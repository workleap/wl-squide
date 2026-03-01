# ADR-0008: Environment Variables on Runtime, Not process.env

## Status

accepted

## Context

In a modular architecture where modules can be built and deployed independently (especially with Module Federation), `process.env` or `import.meta.env` are unreliable — they are baked in at build time per module and may differ across module origins. A remote module built on Monday has different `import.meta.env` values than one built on Friday, yet both run in the same application at the same time.

## Options Considered

1. **`process.env` / `import.meta.env`** — Standard bundler approach. Values frozen at build time per module. Incompatible with independently deployed modules.
2. **Window globals** — Runtime-available but untyped and pollutes global scope. No protection against naming collisions between modules.
3. **Runtime-attached variables** — Registered on the `FireflyRuntime` via an `EnvironmentVariablesPlugin`, accessed through typed hooks.

## Decision

Option 3. Environment variables are registered via `EnvironmentVariablesPlugin` (one of the built-in plugins, ADR-0004) and accessed through `useEnvironmentVariable()` or `runtime.getEnvironmentVariable()`. Unlike most plugins, `EnvironmentVariablesPlugin` is always created by `initializeFirefly` (ADR-0014) — it is not optional.

Variables are provided at initialization time via the `environmentVariables` option on `initializeFirefly`. The `EnvironmentVariablesRegistry` stores them in a `Map<string, unknown>`. Duplicate key handling is intentionally strict: registering the same key with the same value is a no-op (idempotent), but registering the same key with a different value throws an error, preventing silent overwrites from conflicting modules.

TypeScript type safety is achieved through module augmentation: consumers declare their variable names and types by augmenting the empty `EnvironmentVariables` interface exported from `@squide/env-vars`. This gives compile-time checking on `useEnvironmentVariable("apiUrl")` — both the key name and the return type are validated.

Evidence: `packages/env-vars/src/EnvironmentVariablesPlugin.ts` creates the plugin and stores variables in `EnvironmentVariablesRegistry`. `packages/env-vars/src/EnvironmentVariablesRegistry.ts` implements the duplicate-key detection logic. `packages/firefly/src/initializeFirefly.ts` (lines 167-184) always instantiates the plugin. The TypeScript module augmentation pattern is documented in `docs/reference/runtime/FireflyRuntime.md`.

## Consequences

- Variables are set once by the host application and available to all modules regardless of build context or deployment origin.
- Type-safe access via interface augmentation — consumers get compile-time key validation and return type inference.
- Duplicate key conflicts are caught immediately with a descriptive error, preventing subtle runtime bugs from conflicting module configurations.
- Requires the host to explicitly register variables rather than relying on bundler injection — this is intentional, as it makes the data flow explicit and auditable.
