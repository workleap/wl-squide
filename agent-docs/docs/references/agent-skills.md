# Agent Skills

Agent skills are in `.agents/skills/`. Load the relevant skills **before doing any work** in this repository.

## By file type

| File Pattern | Load Skills |
|-------------|-------------|
| `*.ts`, `*.tsx`, `*.js`, `*.jsx` (non-test) | `/accessibility`, `/best-practices` |
| `*.tsx`, `*.jsx` (non-test) | `/workleap-react-best-practices` |
| `*.test.ts`, `*.test.tsx` | `/vitest` |
| `turbo.json` | `/turborepo` |
| `package.json`, `pnpm-workspace.yaml` | `/pnpm` |

## By import

| Import | Load Skill |
|--------|-----------|
| `@workleap/logging` | `/workleap-logging` |
| `@workleap/telemetry` | `/workleap-telemetry` |
| `@workleap/eslint-configs`, `@workleap/typescript-configs`, `@workleap/rsbuild-configs`, `@workleap/rslib-configs` | `/workleap-web-configs` |

## Editing skills

When modifying any file in `agent-skills/`:

- Increment the `metadata.version` minor field in the skill's `SKILL.md` (e.g., `1.3` → `1.4`).
- Read the skill's **Maintenance Notes** section (bottom of `SKILL.md`) before making changes — it contains body-line budgets, split rationale, and pointers to relevant ADRs.
- New API content goes in the appropriate `references/` file, not in the `SKILL.md` body, unless it is a critical pattern needed in nearly every conversation. See [ADR-0030](../../adr/0030-skill-body-reference-split.md) for the rationale.
- To optimize a bloated skill, load the `/library-skill-optimizer` skill.

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
