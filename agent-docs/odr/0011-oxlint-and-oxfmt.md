# ODR-0011: oxlint and oxfmt for Linting and Formatting

## Status

proposed

## Context

The repo linted with ESLint through `@workleap/eslint-configs`, with one `eslint.config.ts` per package and sample. The same preset also did all the formatting, through `@stylistic` rules. Each package ran its own `eslint` Turborepo task, and type-aware rules built a TypeScript program per package, which made linting the slowest step of `pnpm lint`.
## Options Considered

1. **Keep ESLint with `@workleap/eslint-configs`** — Shared Workleap preset, but slow, needs a config file per package, and mixes formatting with linting.
2. **oxlint + oxfmt with a single root config** — Same layout as `workleap/wl-app`. oxlint covers the ESLint core, TypeScript, React, import, jsx-a11y, promise and Vitest rules, with type-aware rules through `oxlint-tsgolint`. oxfmt is a Prettier-compatible formatter that also sorts `package.json`.
3. **oxlint + Prettier** — Keeps a mature formatter, but adds a second toolchain when oxfmt covers the same files.

## Decision

Option 2. `oxlint.config.ts` and `oxfmt.config.ts` sit at the repo root and cover packages and samples. Packages and samples have no lint or format config, and no `eslint` script. Both tools run as root Turborepo tasks (`//#oxlint`, `//#oxfmt:check`) that `lint` depends on. CI runs them on the whole repo instead of filtering by changed packages, because a full run takes seconds. `templates/` are standalone starters, so each one has its own copy of both configs.

Evidence: root `oxlint.config.ts`, `oxfmt.config.ts`, the `lint` task in `turbo.json`, and the "Oxlint" and "Oxfmt" steps in `.github/workflows/ci.yml`.

## Consequences

- There are no testing-library or Storybook lint rules (oxlint has no such plugins), and no validity rules for JSON, YAML or `package.json`. oxfmt only formats those files.
- `printWidth` is 300, matching wl-app. Code examples in `docs/` keep their own wrapping, and Markdown is not formatted.
- `pnpm lint` fails on formatting, so run `pnpm oxfmt` before committing.
- Do NOT reintroduce `@workleap/eslint-configs` or per-package `eslint` scripts, even when Workleap guidance describes them as the default; doing so brings back the slow per-package lint tasks this decision removed.
