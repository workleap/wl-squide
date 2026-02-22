# ADR-0012: Rslib for Library Builds

## Status

accepted

## Context

The 12 library packages need a build tool to produce compiled ESM output with TypeScript declarations for npm publishing.

## Options Considered

1. **tsc** — TypeScript compiler only. Simple but no bundling, no tree-shaking optimization.
2. **Rollup** — Traditional library bundler. Mature but complex configuration.
3. **tsup** — esbuild-based, popular for TS libraries. Fast but separate ecosystem from the app bundler.
4. **Rslib** — Library build tool from the Rsbuild/Rspack ecosystem. Minimal configuration via `@workleap/rslib-configs`.

## Decision

Option 4. All packages use Rslib with shared configuration from `@workleap/rslib-configs`. Each package's `rslib.build.ts` is 4-7 lines.

Evidence: `packages/core/package.json` has `"build": "rslib build --config ./rslib.build.ts"`. The config delegates entirely to `defineBuildConfig` from `@workleap/rslib-configs`.

## Consequences

- Consistency with the app bundler (sample apps use Rsbuild, also Rspack-based).
- Minimal per-package configuration.
- Dependency on Workleap's shared config packages (`@workleap/rslib-configs`).
