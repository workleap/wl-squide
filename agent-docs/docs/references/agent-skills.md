# Agent Skills

This repository has two skill directories:

- **`.agents/skills/`** — General-purpose skills (vitest, pnpm, turborepo, etc.). These are shared across repos. Read-only — do not edit them here.
- **`agent-skills/`** — Project-specific skills authored in this repo (e.g., `workleap-squide`). The editing guidelines below apply only to this directory.

Skills are automatically discovered and loaded by Claude Code based on their `SKILL.md` description field.

## Editing skills

When modifying any file in `agent-skills/`:

- Increment the `metadata.version` minor field in the skill's `SKILL.md` (e.g., `1.3` → `1.4`).
- Never edit a skill file without first reading its **Maintenance Notes** section at the bottom of `SKILL.md`. It defines line budgets and where content belongs. Adding API content to the SKILL.md body instead of `references/` will bloat the skill past token limits and degrade all agents that load it.
- New API content goes in the appropriate `references/` file, not in the `SKILL.md` body, unless it is a critical pattern needed in nearly every conversation. See [ADR-0030](../../adr/0030-skill-body-reference-split.md) for the rationale.

---
*See [CLAUDE.md](../../../CLAUDE.md) for navigation.*
