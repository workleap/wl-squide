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
| Agent Docs | `.github/workflows/update-agent-docs.yml` | Manual | Update agent documentation |
| Retype | `.github/workflows/retype-action.yml` | Push to main, PRs | Build and deploy documentation site |
| Audit Monorepo | `.github/workflows/audit-monorepo.yml` | First day of month | Best practices audit |

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
*See [ARCHITECTURE.md](../../../ARCHITECTURE.md) for full context.*
