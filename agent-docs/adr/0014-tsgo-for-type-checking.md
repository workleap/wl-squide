# ADR-0014: tsgo for Type Checking

## Status

accepted

## Context

Type checking a monorepo with 12 packages is time-consuming with the standard TypeScript compiler (`tsc`). Faster type checking directly improves CI times and developer feedback loops.

## Options Considered

1. **Standard `tsc --noEmit`** — The overwhelmingly common choice. Stable and well-supported.
2. **`tsc --build` with project references** — Incremental type checking across packages. Complex configuration.
3. **`tsgo` (`@typescript/native-preview`)** — The native Go port of the TypeScript compiler. Significantly faster but pre-release (7.0.0-dev).

## Decision

Option 3. All packages use `tsgo` for their `typecheck` script. Standard `typescript` (5.9.3) is also installed for other tooling needs.

Evidence: Every `package.json` has `"typecheck": "tsgo"`. `@typescript/native-preview` at version `7.0.0-dev.20260221.1` is a devDependency across all packages.

## Consequences

- Significantly faster type checking in CI and local development.
- Accepts the risk of a pre-release tool — `tsgo` is updated near-daily.
- Both `tsgo` and `tsc` are installed side-by-side; regular TypeScript is still used by other tools (ESLint, Rslib).
