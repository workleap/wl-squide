# CI/CD Pipeline

## Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push to main, PRs | Build, lint, typecheck, test |
| Changeset | `.github/workflows/changeset.yml` | Push to main | Version bumps and npm publish |
| PR Packages | `.github/workflows/pr-pkg.yml` | PRs | Publish preview packages |
| Update Dependencies | `.github/workflows/update-dependencies.yml` | Weekly (Tue 14:00 UTC) | Automated dependency updates |
| Code Review | `.github/workflows/code-review.yml` | PRs | Automated code review |
| Claude | `.github/workflows/claude.yml` | @claude mentions | Interactive AI assistance |
| Sync Agent Skill | `.github/workflows/sync-agent-skill.yml` | Push to main (docs/) | Sync Squide skill with docs |
| Agent Docs | `.github/workflows/update-agent-docs.yml` | Manual; Push to main (code + `.github/workflows/`) | Update agent documentation |
| Retype | `.github/workflows/retype-action.yml` | Push to main, PRs | Build and deploy documentation site |
| Audit Monorepo | `.github/workflows/audit-monorepo.yml` | First day of month | Best practices audit |
| Smoke Test | `.github/workflows/smoke-test.yml` | PRs to main (packages, endpoints, workflow changes) | Automated smoke test of endpoints app |
| Dogfood | `.github/workflows/dogfood.yml` | 15th of month | Exploratory QA of endpoints app |

## Dogfood Workflow

The dogfood workflow (`dogfood.yml` + `dogfood.md`) runs monthly exploratory QA on the endpoints sample app. Key operational details:

**Server**: Uses `pnpm serve-endpoints` (production-like build), not `pnpm dev-endpoints`. This tests built output rather than dev mode.

**Evidence handling**: Screenshots and videos produced during the session are stored on the `dogfood-evidence` orphan branch in date-stamped directories (`YYYY-MM-DD/screenshots/`, `YYYY-MM-DD/videos/`). The workflow:
1. Fetches or creates the `dogfood-evidence` orphan branch
2. Prunes evidence directories older than 60 days
3. Copies only report-referenced screenshots/videos into the date directory
4. Pushes the branch (requires `contents: write` permission)
5. Rewrites relative asset paths in the report to `https://raw.githubusercontent.com/workleap/wl-squide/dogfood-evidence/YYYY-MM-DD/...` so images render in GitHub issues

**Issue creation**: If issues are found, files a GitHub issue with the rewritten report via `gh issue create` (requires `issues: write` permission). Stops silently if no issues.

**Prompt file**: `.github/prompts/dogfood.md` contains the full operational steps.

## CI Pipeline Details

The main CI workflow (`ci.yml`) runs on `ubuntu-latest` with:
- pnpm install with frozen lockfile
- Turborepo caching (SHA-keyed with restore keys)
- Incremental builds on PRs (only diverging packages)
- Full builds on main branch pushes

## Concurrency

- CI uses `ci-${{ github.ref }}` group with cancel-in-progress
- Dependency updates use `update-dependencies` group

## Relevant Files

- `.github/workflows/` — all workflow definitions
- `.github/prompts/` — prompt files for AI-driven workflows
- `.changeset/` — changeset configuration

---
*See [ARCHITECTURE.md](../../ARCHITECTURE.md) for full context.*
