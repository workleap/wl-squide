# ADR-0013: ESM-Only Output

## Status

accepted

## Context

Library packages need to decide on their module format for published output. The JavaScript ecosystem is transitioning from CommonJS to ES Modules, but some consumers (particularly Node.js server-side code) may still rely on CommonJS.

Squide has been ESM-only from the very first commit (2023-04-25). There was never a CJS phase — the initial `tsup.build.js` configs used `format: ["esm"]`, and `"type": "module"` was present in the first `package.json`. No `"require"` export condition has ever existed in any package across the entire git history. This was a deliberate choice from inception, not a migration.

## Options Considered

1. **Dual CJS/ESM output** — Ship both formats. Maximum compatibility but doubles build output and adds complexity (dual package hazard).
2. **CJS-only** — The older standard. Works everywhere but prevents consumers from benefiting from tree-shaking and static analysis.
3. **ESM-only** — Ship only ES Modules. Forward-looking, smaller output, better tree-shaking.

## Decision

Option 3. Every package uses `"type": "module"`. Published exports use `"import"` and `"default"` conditions only — no `"require"` condition. This was not a migration decision but a founding constraint: the project was architected for ESM-only from day one.

Evidence: All `package.json` files have `"type": "module"` (present since the initial commit `3b80177d5`). The `publishConfig.exports` specify only `"import"` and `"default"` — e.g., `packages/core/package.json` has `"import": "./dist/index.js"` and `"default": "./dist/index.js"` with no `"require"` condition. A git log search for `"require"` conditions across all `package.json` files returns zero results across the entire history.

## Consequences

- Smaller, cleaner published output — no dual-format build artifacts.
- Consumers benefit from tree-shaking and static analysis.
- Consumers on CommonJS-only setups cannot use these packages directly (accepted tradeoff — Squide targets modern React applications that universally use bundlers with ESM support).
- The ESM-only constraint simplifies the build tooling — no need to configure dual output in tsup (originally) or Rslib (currently, ODR-0012).
