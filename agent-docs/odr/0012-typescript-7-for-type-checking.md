# ODR-0012: TypeScript 7 for Type Checking

## Status

proposed

Supersedes [ODR-0003](./0003-tsgo-for-type-checking.md).

## Context

[ODR-0003](./0003-tsgo-for-type-checking.md) adopted `tsgo` from the pre-release `@typescript/native-preview` package to get the speed of the Go port of the TypeScript compiler. The Go port has since shipped as TypeScript 7 in the regular `typescript` package, which every package already depends on (`7.0.2`). Keeping `@typescript/native-preview` means installing two copies of the same compiler and tracking a near-daily `7.0.0-dev` release.

## Options Considered

1. **Keep `tsgo` (`@typescript/native-preview`)** — Same compiler as TypeScript 7, but a pre-release package that duplicates `typescript` and no longer has a reason to exist.
2. **`tsc` from TypeScript 7** — The stable release of the same native compiler, from the `typescript` package that is already installed. This is the path the [Migrate to TypeScript 7](https://workleap.github.io/wl-web-configs/typescript/migrate-to-typescript-7/) guide of `@workleap/typescript-configs` recommends.

## Decision

Option 2. Every `typecheck` script runs `tsc`, and `@typescript/native-preview` is removed from every `package.json` file, including the `templates/` projects. The editor uses the TypeScript 7 language service through the `TypeScriptTeam.native-preview` VS Code extension (recommended in `.vscode/extensions.json`) instead of a `typescript.tsdk` setting, since TypeScript 7 no longer ships `tsserver.js`.

## Consequences

- Type checking keeps the speed of the native compiler while using a stable release.
- One TypeScript package to install and update instead of two.
- The `transit` task in `turbo.json` (introduced alongside ODR-0003) is unchanged: it still invalidates the `typecheck` and `test` caches when a dependency changes.
- Never follow the `workleap-web-configs` skill's `"typecheck": "tsgo"` examples; doing so reinstalls `@typescript/native-preview` and reverses this decision.
