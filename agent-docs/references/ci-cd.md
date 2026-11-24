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

Renovate updates are auto-merged with branch automerge (`automerge` + `automergeType: "branch"`): Renovate pushes the update to a `renovate/*` branch and, on a later run, fast-forwards `main` to it without opening a PR. Major updates are included on purpose. Do not replace the setting with the organization's `all-automerge.json` preset, which only covers minor and patch updates. This depends on two things:

- CI runs on pushes to `renovate/**`. Never remove that trigger from `ci.yml` — Renovate never merges a branch that has no passing check.
- The `Workleap Renovate` GitHub App can push to `main`: it is a bypass actor of the organization rulesets, and `main` has no repository-level branch protection. Adding one that requires a PR or an approval stops the auto-merge.

A merge takes at least a day. Renovate runs once a day, merges one branch per run, and only merges a branch that is up to date with `main` and green — a commit on `main` between two runs costs another day. A branch that stays unmerged during a busy stretch is waiting for a quiet day, not broken.

Renovate opens a regular PR instead when a check fails on the branch, or stays pending for a day. Renovate never auto-merges a branch once it has a PR: a maintainer fixes, approves and merges it.

### Action pins

Every `uses:` is pinned to a commit hash, with the release it matches in a comment:

```yaml
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

Never reference an action by a tag (`@v7`, `@latest`) or a branch. A tag picks up new releases on the next workflow run, which skips the 7-day minimum release age of the organization preset. Never drop the version comment either — Renovate ignores a hash that has none. Renovate pins an action added with a tag on its next run (`helpers:pinGitHubActionDigestsToSemver`). To update an action by hand, change the hash and the version comment together in a regular pull request, to a release that is at least 7 days old.

CI on the `renovate/*` branch only exercises the actions `ci.yml` uses (checkout, pnpm setup, Node setup, cache). An update to `anthropics/claude-code-action`, `changesets/action` or the Retype actions reaches `main` without having run: the minimum release age is its only guard.

`anthropics/claude-code-action` is released almost daily, so it has its own Renovate group. Never move it back into the shared group: Renovate does not merge a branch during the run that changed it, so the other updates would wait behind its releases. Do not add a `schedule` to throttle it either — off schedule, Renovate keeps updating a branch that exists, so a schedule only delays the merges.

## Publish workflow permissions

Every step of a job can use the permissions of that job, including the npm publishing token that `id-token: write` gives access to. `changeset.yml` is therefore split into four jobs with the `changesets/action` sub-actions, so the code that installs and builds the packages never runs in the job that can publish them:

| Job | Runs when | Permissions | Purpose |
|-----|-----------|-------------|---------|
| `select-mode` | Always | `contents: read` | Decides between `version` (changesets are pending), `publish` (a package version is not on npm yet) and `none` |
| `version` | Mode is `version` | `contents: write`, `pull-requests: write` | Creates or updates the "Changeset: New Version" PR |
| `pack` | Mode is `publish` | `contents: read` | Builds the packages and packs them into tarballs, uploaded as an artifact |
| `publish` | After `pack` | `id-token: write`, `contents: write` | Publishes the tarballs to npm, then creates the git tags and the GitHub releases |

Never add a step to the `publish` job, and never give `id-token: write` to another job. A build, a test or a script that has to run before a release goes in the `pack` job. The `publish` job still sets up pnpm and Node and installs the dependencies without lifecycle scripts, because the publish action requires `@changesets/cli` and publishes with `pnpm publish`. Never restore a cache in that job (`cache: pnpm` on `actions/setup-node`) and keep `run_install: false` on `pnpm/action-setup`: a pnpm store filled by another workflow would otherwise provide the CLI that runs with the npm publishing token.

The `publish` job runs in the `npm-publish` GitHub environment, which only accepts the `main` branch and has no reviewer. The npm trusted publisher of each package requires that environment, so a workflow run from another branch cannot publish. This depends on two settings that are not in the repository:

- The `npm-publish` environment exists in the repository settings, with `main` as its only deployment branch. GitHub creates a missing environment without any protection.
- On npm, the trusted publisher of every `@squide/*` package names the `changeset.yml` workflow and the `npm-publish` environment.

Never rename `changeset.yml` or the `npm-publish` environment: the npm trusted publisher of every `@squide/*` package is bound to both names, and the publish stops until npm is updated.

Nothing checks this split automatically, and the `version`, `pack` and `publish` jobs only run on `main`, so a pull request cannot exercise them: review every change to this workflow against the table above. After merging a change to this workflow, watch the next release end to end.

## CI Pipeline Details

The main CI workflow (`ci.yml`) runs on `ubuntu-latest` with:
- pnpm install with frozen lockfile
- Turborepo caching (SHA-keyed with restore keys)
- Incremental builds on PRs (only diverging packages)
- Full builds on pushes (`main` and `renovate/**`)
- A separate `agent-skill-changeset` job, on PRs only: fails when `agent-skills/workleap-squide/` changes without a new changeset for `@squide/firefly` (see [agent-skills.md](./agent-skills.md#editing-skills))

## Node version pin

Every workflow that sets up Node pins `node-version: "26"` (not `">=26.0.0"`) so a new Node major is adopted deliberately rather than whenever `setup-node` picks the latest. Node 26 was blocked until happy-dom 21: Node 26 exposes a native global `localStorage` that returns `undefined` unless `--localstorage-file` is provided, and happy-dom 20.x did not override that getter, so vitest tests touching `localStorage` (e.g. `localStorage.clear()` in `beforeEach`) crashed with `Cannot read properties of undefined (reading 'clear')` (see PR #602 / commit 51037089b). Re-run the `localStorage` tests before the next Node major bump.

## Smoke test

`smoke-test.yml` has an agent start the endpoints sample and open its pages in a browser. Two settings keep its check honest:

- `restrict_untrusted_prs: "false"`. By default the action denies the commands that run a pull request's code when its author is a bot, `pnpm serve-endpoints` included. On the weekly dependency update PR, opened by `claude[bot]`, the server never started and the check passed without testing anything. With the restriction off, the pull request's code runs in commands the agent starts, next to the Anthropic key. `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: "1"` on the job strips that key and the GitHub Actions tokens from the environment of those commands. It is best-effort; never remove it while the restriction is off.
- The agent returns a `passed` field (`--json-schema`), and the last step fails the job unless it is `true`. Never remove that step: without it the check is green whatever the agent found.

A skipped action (see the next section) returns nothing, so the last step is skipped too and the check stays green.

## Editing `claude-code-action` workflows (smoke-test, code-review, claude, sync-agent-skill, update-agent-docs, update-dependencies)

`anthropics/claude-code-action` only runs when the calling workflow file is **byte-identical to the copy on `main`**. Change `smoke-test.yml` on a branch and the action logs:

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
