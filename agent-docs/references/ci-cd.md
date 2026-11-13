# CI/CD Pipeline

## Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push to main and `renovate/**`, PRs | Build, lint, typecheck, test |
| Changeset | `.github/workflows/changeset.yml` | Push to main | Version bumps and npm publish |
| PR Packages | `.github/workflows/pr-pkg.yml` | Push to main, PRs | Publish preview packages |
| Update Dependencies | `.github/workflows/update-dependencies.yml` | Weekly (Tue 14:00 UTC); Manual | Automated dependency and agent skill updates, via the `_update-dependencies` and `_update-skills` skills |
| Code Review | `.github/workflows/code-review.yml` | PRs | Automated code review |
| Claude | `.github/workflows/claude.yml` | @claude mentions | Interactive AI assistance |
| Sync Agent Skill | `.github/workflows/sync-agent-skill.yml` | Manual; Push to main (docs/) | Sync Squide skill with docs |
| Agent Docs | `.github/workflows/update-agent-docs.yml` | Manual; Push to main (code + `.github/workflows/`) | Update agent documentation |
| Retype | `.github/workflows/retype-action.yml` | Manual; Push to main | Build and deploy documentation site |
| Smoke Test | `.github/workflows/smoke-test.yml` | PRs to main (packages, endpoints, workflow changes) | Automated smoke test of endpoints app |

**Renovate** (`renovate.json`) is restricted to the `github-actions` manager. Never enable npm or other managers in Renovate — npm dependencies and agent skills are owned by the Update Dependencies workflow, and enabling them would produce duplicate, conflicting update PRs.

Renovate updates are auto-merged with branch automerge (`automerge` + `automergeType: "branch"`): Renovate pushes the update to a `renovate/*` branch and, on a later run, fast-forwards `main` to it without opening a PR. Major updates are included on purpose — the actions are pinned to major tags, so majors are nearly all Renovate proposes here. Do not replace the setting with the organization's `all-automerge.json` preset, which only covers minor and patch updates. This depends on two things:

- CI runs on pushes to `renovate/**`. Never remove that trigger from `ci.yml` — Renovate never merges a branch that has no passing check.
- The `Workleap Renovate` GitHub App can push to `main`: it is a bypass actor of the organization rulesets, and `main` has no repository-level branch protection. Adding one that requires a PR or an approval stops the auto-merge.

`changesets/action` is excluded (`automerge: false`, in its own group): it holds the npm publishing token and CI never runs it, so its updates get a PR that needs a review.

A merge takes at least a day. Renovate runs once a day, merges one branch per run, and only merges a branch that is up to date with `main` and green — a commit on `main` between two runs costs another day. A branch that stays unmerged during a busy stretch is waiting for a quiet day, not broken.

Renovate opens a regular PR instead when a check fails on the branch, or stays pending for a day. Renovate never auto-merges a branch once it has a PR: a maintainer fixes, approves and merges it.

## CI Pipeline Details

The main CI workflow (`ci.yml`) runs on `ubuntu-latest` with:
- pnpm install with frozen lockfile
- Turborepo caching (SHA-keyed with restore keys)
- Incremental builds on PRs (only diverging packages)
- Full builds on pushes (`main` and `renovate/**`)
- An agent skill discovery check: `skills.sh` must discover only `workleap-squide` (see [agent-skills.md](./agent-skills.md))
- A separate `agent-skill-changeset` job, on PRs only: fails when `agent-skills/workleap-squide/` changes without a new changeset for `@squide/firefly` (see [agent-skills.md](./agent-skills.md#editing-skills))

## Node version pin

Every workflow that sets up Node pins `node-version: "26"` (not `">=26.0.0"`) so a new Node major is adopted deliberately rather than whenever `setup-node` picks the latest. Node 26 was blocked until happy-dom 21: Node 26 exposes a native global `localStorage` that returns `undefined` unless `--localstorage-file` is provided, and happy-dom 20.x did not override that getter, so vitest tests touching `localStorage` (e.g. `localStorage.clear()` in `beforeEach`) crashed with `Cannot read properties of undefined (reading 'clear')` (see PR #602 / commit 51037089b). Re-run the `localStorage` tests before the next Node major bump.

## Editing `claude-code-action` workflows (smoke-test, code-review, claude, sync-agent-skill, update-agent-docs, update-dependencies)

`anthropics/claude-code-action@v1` only runs when the calling workflow file is **byte-identical to the copy on `main`**. Change `smoke-test.yml` on a branch and the action logs:

```
Skipping action due to workflow validation: Workflow validation failed.
The workflow file must exist and have identical content to the version on
the repository's default branch.
```

It then exits early and **the step still reports success** — a green check that never ran the agent. The give-away is duration: a real smoke test takes minutes, a skipped one about 4 seconds.

Consequences:

- Never validate a change to these workflows on its own PR. The check that reports on it is a no-op. Tune behaviour through `.github/prompts/*.md` instead — prompt files are read from the branch and are not subject to this validation.
- A change to `claude_args` (`--max-turns`, `--allowedTools`) only takes effect after it lands on `main`, and is first exercised by the *next* PR.

## Concurrency

- CI uses `ci-${{ github.ref }}` group with cancel-in-progress
- Dependency updates use `update-dependencies` group

## Relevant Files

- `.github/workflows/` — all workflow definitions
- `.github/prompts/` — prompt files for AI-driven workflows
- `.changeset/` — changeset configuration

---
*See [ARCHITECTURE.md](../ARCHITECTURE.md) for full context.*
