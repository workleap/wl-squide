# ODR-0002: Rslib for Library Builds

## Status

accepted

## Context

The 12 library packages need a build tool to produce compiled ESM output with TypeScript declarations for npm publishing. From the initial commit (2023-04-25) through late 2024, all packages used tsup (via `@workleap/tsup-configs`) with separate `tsup.build.ts` and `tsup.dev.ts` configs per package. While tsup was fast (esbuild-based), it was a separate ecosystem from the application bundler (Rsbuild/Rspack), creating inconsistency between how libraries were built and how applications consumed them.

## Options Considered

1. **tsc** — TypeScript compiler only. Simple but no bundling, no tree-shaking optimization.
2. **Rollup** — Traditional library bundler. Mature but complex configuration.
3. **tsup** — esbuild-based, popular for TS libraries. The prior approach. Fast but separate ecosystem from the app bundler.
4. **Rslib** — Library build tool from the Rsbuild/Rspack ecosystem. Minimal configuration via `@workleap/rslib-configs`.

## Decision

Option 4. All packages use Rslib with shared configuration from `@workleap/rslib-configs`. Each package's `rslib.build.ts` is 4-7 lines, delegating entirely to `defineBuildConfig`.

The migration from tsup to Rslib was introduced in commit `4eb46d69` (2024-12-15, PR #225) — the same commit that introduced the JIT pattern (ODR-0001). Initially, Rslib configs used raw `@rslib/core` with inline configuration (~20 lines per package). A follow-up commit (`3c6bce0cd`, 2025-01-16) migrated to `@workleap/rslib-configs`, reducing each config to 4-7 lines. The two config packages (`firefly-rsbuild-configs`, `firefly-webpack-configs`) additionally have an `rslib.dev.ts` for watch mode during development.

Evidence: `packages/core/package.json` has `"build": "rslib build --config ./rslib.build.ts"`. `packages/core/rslib.build.ts` delegates to `defineBuildConfig` from `@workleap/rslib-configs` with `react: true` and a `tsconfigPath`. The changeset for the shared config migration reads: "Packages now includes source code and sourcemap."

## Consequences

- Consistency with the app bundler — sample apps use Rsbuild, libraries use Rslib, both are Rspack-based.
- Minimal per-package configuration (4-7 lines vs. 20+ with tsup).
- The tsup + nodemon tooling chain was eliminated entirely — Rslib handles both build and watch modes.
- Dependency on Workleap's shared config packages (`@workleap/rslib-configs`).
