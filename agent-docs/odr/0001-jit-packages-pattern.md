# ODR-0001: JIT (Just-In-Time) Packages Pattern

## Status

accepted

## Context

In a monorepo with 12 library packages, waiting for every package to build before starting development creates a slow feedback loop. Prior to the JIT pattern, all packages used tsup (via `@workleap/tsup-configs`) with separate `tsup.build.ts` and `tsup.dev.ts` configs. The `dev` task in `turbo.json` depended on the full `build` graph (`"dependsOn": ["build"]`), meaning every package had to be compiled before any sample application could start. Sample packages additionally used `nodemon` to watch for tsup config changes and re-trigger builds — adding another layer of tooling.

The key insight was that most packages are consumed by sample applications running Rsbuild or Webpack, both of which can process TypeScript directly without a pre-compilation step.

## Options Considered

1. **Pre-build all packages** — The tsup-based approach. Run `build` for the full dependency chain before `dev`. Slow for iterative development (the original state).
2. **TypeScript project references** — Chain builds via `tsc --build`. Complex configuration, incremental but still requires a build step.
3. **JIT packages** — Dev `exports` points to raw `.ts` source (`"./src/index.ts"`). `publishConfig.exports` overrides to compiled `dist/` output at publish time. During development, the consuming bundler transpiles on the fly.

## Decision

Option 3. Ten of 12 packages use JIT. The two exceptions (`firefly-rsbuild-configs` and `firefly-webpack-configs`) must be built because bundler config files run in Node.js and cannot import raw TypeScript from other packages.

The JIT pattern and the migration from tsup to Rslib (ODR-0002) were introduced in the same commit (`4eb46d69`, 2024-12-15, PR #225 — 476 files changed). This was a coordinated architectural shift: the same commit that replaced tsup with Rslib also changed package.json `exports` from `"./dist/..."` to `"./src/..."`, removed `nodemon.json` files from samples, and narrowed the `turbo.json` `dev` task to depend only on the two config packages.

Evidence: `packages/core/package.json` has `"exports": { ".": "./src/index.ts" }` alongside `"publishConfig": { "exports": { ".": { "import": "./dist/index.js" } } }`. `turbo.json` `dev` task: `"dependsOn": ["@squide/firefly-rsbuild-configs#build", "@squide/firefly-webpack-configs#build"]`. Sample packages (e.g., `samples/basic/shared/package.json`) have no `build` or `dev` scripts at all — just `eslint` and `typecheck`.

## Consequences

- No build step needed for 10/12 packages during development — immediate feedback on code changes.
- The bundler (Rsbuild/Webpack) transpiles raw TypeScript on the fly, eliminating the tsup + nodemon tooling chain.
- Published packages ship compiled ESM via `publishConfig.exports` override — consumers on npm get standard compiled output.
- Source files are included in published packages (`"files": ["src", "dist"]`) for debugging and source map support.
- The `turbo.json` `dev` task dependency narrowed from the entire build graph to just 2 config packages, drastically reducing dev startup time.
