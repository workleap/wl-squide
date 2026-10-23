---
description: Refresh the agent skills installed in `.agents/skills/`, but only when the matching workspace package is on the latest minor (patch ignored). Skills with no package gate are always updated.
model: sonnet
effort: medium
metadata:
  internal: true
---

# Update Skills

Re-pull every `pnpx skills add` installed skill in this repo, but only when the matching package in the workspace is on the latest `major.minor`. Print the eligibility table before running anything; on lag, skip + warn (never auto-bump deps).

## Skills

Skills install into `.agents/skills/`. Only the rows marked **linked** also keep a copy in `.claude/skills/`, which is curated: never add or remove a `.claude/skills/` copy as a side effect of an update.

- `-a codex` writes only the shared `.agents/skills/` copy. Never omit `-a` — the CLI would then also link the skill into `.claude/skills/`.
- Linked rows add `claude-code --copy` so the `.claude/skills/` copy is refreshed as files, not replaced by a symlink.
- Only `workleap-*` skills use `--full-depth`.

| Skill | Linked | Package gate (workspace `package.json` files) | Update command |
|---|---|---|---|
| `accessibility` | yes | — | `pnpx skills add https://github.com/addyosmani/web-quality-skills --skill accessibility -a codex claude-code --copy -y` |
| `agent-browser` | no | `agent-browser` | `pnpx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -a codex -y` |
| `best-practices` | yes | — | `pnpx skills add https://github.com/addyosmani/web-quality-skills --skill best-practices -a codex claude-code --copy -y` |
| `dogfood` | no | `agent-browser` | `pnpx skills add https://github.com/vercel-labs/agent-browser --skill dogfood -a codex -y` |
| `git-commit` | no | — | `pnpx skills add https://github.com/github/awesome-copilot --skill git-commit -a codex -y` |
| `pnpm` | no | `pnpm` (root `packageManager` field — not bumped by `update-outdated-deps`, so expect `SKIP` until pnpm is bumped by hand) | `pnpx skills add https://github.com/antfu/skills --skill pnpm -a codex -y` |
| `turborepo` | no | `turbo` | `pnpx skills add https://github.com/vercel/turborepo --skill turborepo -a codex -y` |
| `vitest` | yes | `vitest` | `pnpx skills add https://github.com/antfu/skills --skill vitest -a codex claude-code --copy -y` |
| `workleap-logging` | yes | `@workleap/logging` | `pnpx skills add https://github.com/workleap/wl-logging --skill workleap-logging -a codex claude-code --copy --full-depth -y` |
| `workleap-react-best-practices` | no | — | `pnpx skills add https://github.com/workleap/wl-web-configs --skill workleap-react-best-practices -a codex --full-depth -y` |
| `workleap-telemetry` | yes | `@workleap/telemetry` | `pnpx skills add https://github.com/workleap/wl-telemetry --skill workleap-telemetry -a codex claude-code --copy --full-depth -y` |
| `workleap-web-configs` | yes | `@workleap/eslint-configs`, `@workleap/typescript-configs`, `@workleap/rsbuild-configs`, `@workleap/rslib-configs`, `@workleap/stylelint-configs`, `@workleap/browserslist-config` | `pnpx skills add https://github.com/workleap/wl-web-configs --skill workleap-web-configs -a codex claude-code --copy --full-depth -y` |

## Process

### 0. Audit drift

List `.agents/skills/` and compare it to the `Skill` column in the table above. Then list `.claude/skills/`, filter out `_`-prefixed folders (project-local skills, not installs), and compare the rest to the rows marked **linked**.

- Folder present, no table row → **stop**. Print `unknown skill "<name>" at <folder> — add a row to SKILL.md and re-run.`
- `skills-lock.json` entry with no table row, or the reverse → **stop**. Print `lock drift "<name>" — reconcile skills-lock.json with the table, then re-run.`
- Table row present, no folder → **stop**. Print `stale row "<name>" — folder missing. Remove the row or reinstall the skill, then re-run.`

Only proceed once the sets match exactly.

### 1. Read installed versions

For each gated skill, grep every workspace `package.json` (root, `packages/*`, `samples/**`) for the listed package name(s) and collect every pinned version. Skip `node_modules/` and `templates/` — templates are outside the workspace and never bumped. For `pnpm`, read the version from the root `packageManager` field.

### 2. Fetch latest versions

For each unique package: `pnpm view <package> version`. Parallelize.

### 3. Compute eligibility

For each gated package: extract `major.minor` from installed vs latest (ignore patch, prereleases and range prefixes such as `^`) → `current` or `lagging`. A skill is eligible only if every mapped package found in the workspace is `current` **and** every pinned occurrence across the workspace matches. A mapped package absent from the workspace is ignored. Untied skills (`—` gate) are always eligible.

### 4. Print eligibility table

Print before running anything. Use `UPDATE` or `SKIP` (gated package lagging).

```
skill                          | status  | details
workleap-logging               | UPDATE  | @workleap/logging 2.0.1 vs latest 2.0.3 (minor matches)
workleap-web-configs           | SKIP    | @workleap/rsbuild-configs lagging: 5.0.0 vs latest 5.2.0
...
```

### 5. Run updates

Run the matching command from the table for each `UPDATE` row, sequentially — the skill installer mutates a shared store and `skills-lock.json`.

After each pull, grep the skill's new `SKILL.md` frontmatter for `model:`. An upstream-added override switches the conversation model mid-turn for whatever invokes the skill — flag it in the report; never strip it yourself.

### 6. Report

- Skills updated (count + list)
- Skills skipped (with the lagging package: installed vs latest)
- Skills whose pulled `SKILL.md` declares `model:` frontmatter
- Any `pnpx skills add` failures (full error)
