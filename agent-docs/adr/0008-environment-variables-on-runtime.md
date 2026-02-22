# ADR-0008: Environment Variables on Runtime, Not process.env

## Status

accepted

## Context

In a modular architecture where modules can be built and deployed independently (especially with Module Federation), `process.env` or `import.meta.env` are unreliable — they are baked in at build time per module and may differ across module origins.

## Options Considered

1. **`process.env` / `import.meta.env`** — Standard bundler approach. Values frozen at build time per module.
2. **Window globals** — Runtime-available but untyped and pollutes global scope.
3. **Runtime-attached variables** — Registered on the `FireflyRuntime` via an `EnvironmentVariablesPlugin`, accessed through typed hooks.

## Decision

Option 3. Environment variables are registered via `EnvironmentVariablesPlugin` and accessed through `useEnvironmentVariable()` or `runtime.getEnvironmentVariable()`. TypeScript interface augmentation provides type safety.

Evidence: `packages/env-vars/src/EnvironmentVariablesPlugin.ts`. Variables stored in `EnvironmentVariablesRegistry`, accessed by typed keys.

## Consequences

- Variables are set by the host application and available to all modules regardless of build context.
- Type-safe access via interface augmentation.
- Requires the host to explicitly register variables rather than relying on bundler injection.
