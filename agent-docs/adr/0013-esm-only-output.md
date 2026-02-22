# ADR-0013: ESM-Only Output

## Status

accepted

## Context

Library packages need to decide on their module format for published output. The JavaScript ecosystem is transitioning from CommonJS to ES Modules, but some consumers (particularly Node.js server-side code) may still rely on CommonJS.

## Options Considered

1. **Dual CJS/ESM output** — Ship both formats. Maximum compatibility but doubles build output and adds complexity (dual package hazard).
2. **CJS-only** — The older standard. Works everywhere but prevents consumers from benefiting from tree-shaking and static analysis.
3. **ESM-only** — Ship only ES Modules. Forward-looking, smaller output, better tree-shaking.

## Decision

Option 3. Every package uses `"type": "module"`. Published exports use `"import"` and `"default"` conditions only — no `"require"` condition.

Evidence: All `package.json` files have `"type": "module"`. The `publishConfig.exports` specify only `"import"` and `"default"`.

## Consequences

- Smaller, cleaner published output.
- Consumers benefit from tree-shaking and static analysis.
- Consumers on CommonJS-only setups cannot use these packages directly.
