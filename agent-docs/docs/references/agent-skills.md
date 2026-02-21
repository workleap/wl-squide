# Agent Skills

Agent skills are in `.agents/skills/`. Load the relevant skills **before doing any work** in this repository.

## By file type

| File Pattern | Load Skills |
|-------------|-------------|
| `*.ts`, `*.tsx`, `*.js`, `*.jsx` (non-test) | `/accessibility`, `/best-practices` |
| `*.test.ts`, `*.test.tsx` | `/vitest` |
| `turbo.json` | `/turborepo` |
| `package.json`, `pnpm-workspace.yaml` | `/pnpm` |

## By import

| Import | Load Skill |
|--------|-----------|
| `@workleap/logging` | `/workleap-logging` |
| `@workleap/telemetry` | `/workleap-telemetry` |
| `@workleap/eslint-configs`, `@workleap/typescript-configs`, `@workleap/rsbuild-configs`, `@workleap/rslib-configs` | `/workleap-web-configs` |

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
