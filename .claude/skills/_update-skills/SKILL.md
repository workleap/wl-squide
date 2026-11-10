---
description: Refresh the agent skills installed in `.claude/skills/`, but only when the matching workspace package is on the latest minor (patch ignored). Skills with no package gate are always updated.
model: sonnet
effort: medium
metadata:
  internal: true
---

# Update Skills

Re-pull every `pnpm dlx skills@latest add` installed skill in this repo, but only when the matching package in the workspace is on the latest `major.minor`. Print the eligibility table before running anything; on lag, skip + warn (never auto-bump deps).

## Skills

Skills install into `.claude/skills/` only, as files (`--copy`), never symlinks. `.agents/skills/` must not exist: pnpm also links package skills into it when it does.

- Only `workleap-*` skills use `--full-depth`.
- Every command pins `skills@latest`: `.npmrc` points pnpm at the GitHub package firewall, which holds back new releases, and a bare `skills` can ask for a version the firewall doesn't serve yet, so the CLI download fails.

| Skill | Package gate (workspace `package.json` files) | Update command |
|---|---|---|
| `accessibility` | — | `pnpm dlx skills@latest add https://github.com/addyosmani/web-quality-skills --skill accessibility -a claude-code --copy -y` |
| `agent-browser` | `agent-browser` | `pnpm dlx skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -a claude-code --copy -y` |
| `best-practices` | — | `pnpm dlx skills@latest add https://github.com/addyosmani/web-quality-skills --skill best-practices -a claude-code --copy -y` |
| `dogfood` | `agent-browser` | `pnpm dlx skills@latest add https://github.com/vercel-labs/agent-browser --skill dogfood -a claude-code --copy -y` |
| `git-commit` | — | `pnpm dlx skills@latest add https://github.com/github/awesome-copilot --skill git-commit -a claude-code --copy -y` |
| `pnpm` | `pnpm` (root `packageManager` field — not bumped by `update-outdated-deps`, so expect `SKIP` until pnpm is bumped by hand) | `pnpm dlx skills@latest add https://github.com/antfu/skills --skill pnpm -a claude-code --copy -y` |
| `turborepo` | `turbo` | `pnpm dlx skills@latest add https://github.com/vercel/turborepo --skill turborepo -a claude-code --copy -y` |
| `vitest` | `vitest` | `pnpm dlx skills@latest add https://github.com/antfu/skills --skill vitest -a claude-code --copy -y` |
| `workleap-logging` | `@workleap/logging` | `pnpm dlx skills@latest add https://github.com/workleap/wl-logging --skill workleap-logging -a claude-code --copy --full-depth -y` |
| `workleap-react-best-practices` | — | `pnpm dlx skills@latest add https://github.com/workleap/wl-web-configs --skill workleap-react-best-practices -a claude-code --copy --full-depth -y` |
| `workleap-telemetry` | `@workleap/telemetry` | `pnpm dlx skills@latest add https://github.com/workleap/wl-telemetry --skill workleap-telemetry -a claude-code --copy --full-depth -y` |
| `workleap-web-configs` | `@workleap/typescript-configs`, `@workleap/rsbuild-configs`, `@workleap/rslib-configs`, `@workleap/stylelint-configs`, `@workleap/browserslist-config` | `pnpm dlx skills@latest add https://github.com/workleap/wl-web-configs --skill workleap-web-configs -a claude-code --copy --full-depth -y` |

## Process

### 0. Audit drift

If `.agents/skills/` exists → **stop**. Print `.agents/skills/ exists — skills install into .claude/skills/ only. Move or remove it, then re-run.`

List `.claude/skills/`, filter out `_`-prefixed folders (project-local skills, not installs) and the skills listed in the `# pnpm` block of `.claude/skills/.gitignore` (package skills that pnpm links), and compare the rest to the `Skill` column in the table above.

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
- Any `pnpm dlx skills@latest add` failures (full error)
