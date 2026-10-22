# Agent Skills

This repository has three skill directories:

- **`.agents/skills/`** — General-purpose skills (vitest, pnpm, turborepo, etc.). These are shared across repos. Read-only — do not edit them here.
- **`.claude/skills/`** — Claude Code's native skill directory. Contains copies of selected `.agents/skills/` entries so they appear in Claude Code's skill discovery, plus `_`-prefixed project-local maintenance skills (`_update-third-parties`, `_update-dependencies`, `_update-skills`). This is a supplementary layer — not a replacement for `.agents/skills/`.
- **`agent-skills/`** — Project-specific skills authored in this repo (e.g., `workleap-squide`). The editing guidelines below apply only to this directory.

`agent-skills/workleap-squide/` is the only source of the skill. Consumers install it from GitHub with `skills.sh`, and `@squide/firefly` also ships it for pnpm agent skills: the package's `prepack` script (`packages/firefly/scripts/agent-skill.mjs`) copies it to `packages/firefly/skills/`, which is gitignored and removed by `postpack`. Never commit a copy, since `skills.sh` could then discover two `workleap-squide` skills.

Skills are automatically discovered and loaded by Claude Code from all three directories based on their `SKILL.md` description field.

## Updating installed skills

Run `/_update-third-parties` (dependencies and skills) or `/_update-skills` (skills only). The weekly `update-dependencies.yml` workflow runs the same skills in CI.

When you install or remove a skill in `.agents/skills/`, add or remove its row in `.claude/skills/_update-skills/SKILL.md`. The skill stops on any mismatch between that table and the installed folders.

## Editing skills

When modifying any file in `agent-skills/`:

- Increment the `metadata.version` minor field in the skill's `SKILL.md` (e.g., `1.3` → `1.4`).
- Never edit a skill file without first reading its **Maintenance Notes** section at the bottom of `SKILL.md`. It defines line budgets and where content belongs. Adding API content to the SKILL.md body instead of `references/` will bloat the skill past token limits and degrade all agents that load it.
- New API content goes in the appropriate `references/` file, not in the `SKILL.md` body, unless it is a critical pattern needed in nearly every conversation. See [ODR-0008](../odr/0008-skill-body-reference-split.md) for the rationale.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
