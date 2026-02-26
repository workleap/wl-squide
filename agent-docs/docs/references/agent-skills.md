# Agent Skills

This repository has two skill directories:

- **`.agents/skills/`** — General-purpose skills (vitest, pnpm, turborepo, etc.). These are shared across repos. Read-only — do not edit them here.
- **`agent-skills/`** — Project-specific skills authored in this repo (e.g., `workleap-squide`). The "Editing skills" section below applies only to this directory.

**Never write code without first loading the matching skills from the tables below.** Code produced without the correct skill will use wrong patterns and fail review.

## By file type

| File Pattern | Load Skills |
|-------------|-------------|
| `*.ts`, `*.tsx`, `*.js`, `*.jsx` (non-test) | `/accessibility`, `/best-practices` |
| `*.tsx`, `*.jsx` (non-test) | `/workleap-react-best-practices` |
| `*.test.ts`, `*.test.tsx` | `/vitest` |
| `turbo.json` | `/turborepo` |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc` | `/pnpm` |

## By task

| Task | Tool |
|------|------|
| Browser validation of sample apps | `agent-browser` (installed as workspace devDependency; see `.agents/skills/agent-browser/`) |

## By import

| Import | Load Skill |
|--------|-----------|
| `@workleap/logging` | `/workleap-logging` |
| `@workleap/telemetry` | `/workleap-telemetry` |
| `@workleap/browserslist-config`, `@workleap/eslint-configs`, `@workleap/stylelint-configs`, `@workleap/typescript-configs`, `@workleap/rsbuild-configs`, `@workleap/rslib-configs` | `/workleap-web-configs` |

## Editing skills

When modifying any file in `agent-skills/`:

- Increment the `metadata.version` minor field in the skill's `SKILL.md` (e.g., `1.3` → `1.4`).
- Never edit a skill file without first reading its **Maintenance Notes** section at the bottom of `SKILL.md`. It defines line budgets and where content belongs. Adding API content to the SKILL.md body instead of `references/` will bloat the skill past token limits and degrade all agents that load it.
- New API content goes in the appropriate `references/` file, not in the `SKILL.md` body, unless it is a critical pattern needed in nearly every conversation. See [ADR-0030](../../adr/0030-skill-body-reference-split.md) for the rationale.

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
