# Build Tooling

## Overview

| Layer | Tool | Config |
|-------|------|--------|
| Library packages | Rslib | Each package has `rslib.build.ts` (and some have `rslib.dev.ts`) |
| Monorepo orchestration | Turborepo | `turbo.json` task graph |
| Sample apps (only) | Rsbuild or Webpack | `@squide/firefly-rsbuild-configs` / `@squide/firefly-webpack-configs` |

The sample applications still use Rsbuild/Webpack configs tied to module federation for legacy
and practical reasons. These configs are **not used by the packages themselves**.

## Shared Configs (`@workleap/web-configs`)

The repo uses shared configuration packages from [`@workleap/web-configs`](https://github.com/workleap/web-configs):

- `@workleap/typescript-configs` — TypeScript base configurations
- `@workleap/rslib-configs` — Rslib base presets for library builds
- `@workleap/browserslist-config` — shared browserslist targets

## Linting and Formatting

Linting uses [oxlint](https://oxc.rs/docs/guide/usage/linter) (type-aware through `oxlint-tsgolint`) and formatting uses [oxfmt](https://oxc.rs/docs/guide/usage/formatter), each from a single root config: `oxlint.config.ts` and `oxfmt.config.ts`. Packages and samples have no lint config of their own. Both run as root Turborepo tasks (`//#oxlint`, `//#oxfmt:check`). See [ODR-0011](../odr/0011-oxlint-and-oxfmt.md).

## Relevant Files

- `turbo.json` — task definitions and caching
- `packages/firefly-rsbuild-configs/` — Rsbuild config factory (sample apps only)
- `packages/firefly-webpack-configs/` — Webpack config factory (sample apps only)

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
