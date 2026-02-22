# ADR-0011: JIT (Just-In-Time) Packages Pattern

## Status

accepted

## Context

In a monorepo with 12 library packages, waiting for every package to build before starting development creates a slow feedback loop. Most packages are consumed by sample applications that use bundlers capable of processing TypeScript directly.

## Options Considered

1. **Pre-build all packages** — Traditional approach. Run `build` for the full dependency chain before `dev`. Slow for iterative development.
2. **TypeScript project references** — Chain builds via `tsc --build`. Complex configuration, incremental but still requires a build step.
3. **JIT packages** — Dev `exports` points to raw `.ts` source (`"./src/index.ts"`). `publishConfig.exports` overrides to compiled `dist/` output at publish time. During development, the consuming bundler transpiles on the fly.

## Decision

Option 3. Ten of 12 packages use JIT. The two exceptions (`firefly-rsbuild-configs` and `firefly-webpack-configs`) must be built because bundler config files cannot import raw TypeScript from other packages.

Evidence: `packages/core/package.json` has `"exports": { ".": "./src/index.ts" }` alongside `"publishConfig": { "exports": { ".": { "import": "./dist/index.js" } } }`. The `turbo.json` `dev` task only depends on building the two config packages: `"dependsOn": ["@squide/firefly-rsbuild-configs#build", "@squide/firefly-webpack-configs#build"]`.

## Consequences

- No build step needed for 10/12 packages during development — immediate feedback.
- The bundler (Rsbuild/Webpack) transpiles raw TypeScript on the fly.
- Published packages ship compiled ESM via `publishConfig.exports` override.
- Source files are included in published packages (`"files": ["src", "dist"]`) for debugging.
