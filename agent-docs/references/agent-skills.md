# Agent Skills

This repository has two skill directories:

- **`.claude/skills/`** — Installed skills from `skills.sh` (vitest, pnpm, turborepo, etc.), tracked in `skills-lock.json`. These are shared across repos. Read-only — do not edit them here. It also holds the `_`-prefixed project-local maintenance skills (`_update-third-parties`, `_update-dependencies`, `_update-skills`, `_update-github-actions`). There is no `.agents/skills/` folder. Skills that a dependency ships (`agent-browser`, `workleap-logging`, `workleap-telemetry` and the `workleap-*-config(s)` skills) are not installed with `skills.sh`: the packages approved under `permissions` in `pnpm-workspace.yaml` have their skills linked by `pnpm install`, which lists them in the `# pnpm` block of `.claude/skills/.gitignore`. pnpm links package skills only into `.claude/skills/` (the `skills.dirs` setting in `pnpm-workspace.yaml`); never remove that setting, or pnpm links them into every existing `.<agent>/skills/` folder.
- **`agent-skills/`** — Project-specific skills authored in this repo (e.g., `workleap-squide`). The editing guidelines below apply only to this directory.

`agent-skills/workleap-squide/` is the only source of the skill. The user docs (`docs/introduction/use-with-agents.md`) tell consumers to install it only through pnpm agent skills, which `@squide/firefly` ships it for, and to remove any copy previously installed with `skills.sh`; it remains discoverable from GitHub with `skills.sh`. The package's `prepack` script (`packages/firefly/scripts/agent-skill.mjs`) copies it to `packages/firefly/skills/`, which is gitignored and removed by `postpack`. Never commit a copy, since `skills.sh` could then discover two `workleap-squide` skills.

`skills.sh` finds `workleap-squide` through `.claude-plugin/marketplace.json`. Without it, the CLI reaches `agent-skills/` only when `.claude/skills/` contains no usable skill, so any new visible skill there would hide `workleap-squide` from consumers. Every project-local skill in `.claude/skills/` must set `metadata.internal: true` in its frontmatter so `skills.sh` never offers it to consumers. The CI workflow fails if `skills.sh` discovers anything other than `workleap-squide`.

Skills are automatically discovered and loaded by Claude Code from both directories based on their `SKILL.md` description field.

## Updating installed skills

Run `/_update-third-parties` (dependencies, skills, and GitHub Actions) or `/_update-skills` (skills only). The weekly `update-dependencies.yml` workflow runs the dependency and skill updates in CI. GitHub Actions are updated on a schedule by Renovate (`renovate.json`); `/_update-github-actions` bumps them on demand.

When you install or remove a skill in `.claude/skills/`, add or remove its row in `.claude/skills/_update-skills/SKILL.md`. The skill stops on any mismatch between that table and the installed folders.

## Editing skills

When modifying any file in `agent-skills/`:

- Increment the `metadata.version` minor field in the skill's `SKILL.md` (e.g., `1.3` → `1.4`).
- Never edit a skill file without first reading its **Maintenance Notes** section at the bottom of `SKILL.md`. It defines line budgets and where content belongs. Adding API content to the SKILL.md body instead of `references/` will bloat the skill past token limits and degrade all agents that load it.
- New API content goes in the appropriate `references/` file, not in the `SKILL.md` body, unless it is a critical pattern needed in nearly every conversation. See [ODR-0008](../odr/0008-skill-body-reference-split.md) for the rationale.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
