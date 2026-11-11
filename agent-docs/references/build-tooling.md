# Build Tooling

## Overview

| Layer | Tool | Config |
|-------|------|--------|
| Library packages | Rslib | Each package has `rslib.build.ts` (and some have `rslib.dev.ts`) |
| Monorepo orchestration | Turborepo | `turbo.json` task graph |
| Sample apps | Rsbuild | `@workleap/rsbuild-configs` |

The sample applications use `defineDevConfig` / `defineBuildConfig` from `@workleap/rsbuild-configs`.
`@squide/firefly-rsbuild-configs` and `@squide/firefly-webpack-configs` are still published, in maintenance
mode, but no sample uses them.

## Shared Configs (`workleap/wl-web-configs`)

The repo uses shared configuration packages from [`workleap/wl-web-configs`](https://github.com/workleap/wl-web-configs):

- `@workleap/typescript-configs` — TypeScript base configurations
- `@workleap/rslib-configs` — Rslib base presets for library builds
- `@workleap/rsbuild-configs` — Rsbuild base presets for the sample applications
- `@workleap/browserslist-config` — shared browserslist targets

## Linting and Formatting

Linting uses [oxlint](https://oxc.rs/docs/guide/usage/linter) (type-aware through `oxlint-tsgolint`) and formatting uses [oxfmt](https://oxc.rs/docs/guide/usage/formatter), each from a single root config: `oxlint.config.ts` and `oxfmt.config.ts`. Packages and samples have no lint config of their own. Both run as root Turborepo tasks (`//#oxlint`, `//#oxfmt:check`). See [ODR-0011](../odr/0011-oxlint-and-oxfmt.md).

## Relevant Files

- `turbo.json` — task definitions and caching
- `packages/firefly-rsbuild-configs/` — Rsbuild config factory (maintenance mode, not used by any sample)
- `packages/firefly-webpack-configs/` — Webpack config factory (maintenance mode, not used by any sample)

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
