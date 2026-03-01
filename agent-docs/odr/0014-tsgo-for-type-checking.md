# ODR-0014: tsgo for Type Checking

## Status

accepted

## Context

Type checking a monorepo with 12 packages is time-consuming with the standard TypeScript compiler (`tsc`). Faster type checking directly improves CI times and developer feedback loops. All packages previously used `"typecheck": "tsc"` with standard `typescript`.

## Options Considered

1. **Standard `tsc --noEmit`** — The overwhelmingly common choice. Stable and well-supported. The prior approach.
2. **`tsc --build` with project references** — Incremental type checking across packages. Complex configuration.
3. **`tsgo` (`@typescript/native-preview`)** — The native Go port of the TypeScript compiler. Faster but pre-release (7.0.0-dev).

## Decision

Option 3. All packages use `tsgo` for their `typecheck` script. The migration was a full-repo switch in commit `f024f44da` (2026-01-23, merged as PR #381): every `"typecheck": "tsc"` was changed to `"typecheck": "tsgo"` across all 35 package.json files simultaneously. Standard `typescript` (5.9.3) remains installed for other tooling needs (ESLint, Rslib).

The VSCode integration was also configured (`typescript.experimental.useTsgo: true` with `typescript.tsdk` pointing to `@typescript/native-preview/lib`), though this was later reverted to the standard TypeScript SDK for the editor while the CLI `tsgo` remains in use for type checking scripts.

A `transit` task was added to `turbo.json` (PR #379) to fix parallel task cache invalidation when `eslint` and `typecheck` tasks run concurrently — both now depend on the `transit` task for correct cache key ordering.

Evidence: Every `package.json` has `"typecheck": "tsgo"`. `@typescript/native-preview` at version `7.0.0-dev.20260221.1` is a devDependency across all packages. No package retains `"typecheck": "tsc"`. The package is updated near-daily (introduced at `7.0.0-dev.20260122.4`, now at `7.0.0-dev.20260221.1`).

## Consequences

- Faster type checking in CI and local development (no specific benchmarks captured, but the Go port is architecturally faster due to native compilation and parallelism).
- Accepts the risk of a pre-release tool — `tsgo` is updated near-daily and the API surface may change.
- Both `tsgo` and `tsc` are installed side-by-side; regular TypeScript is still used by other tools (ESLint, Rslib).
- The `transit` task in `turbo.json` ensures correct cache invalidation when typecheck runs in parallel with lint.
