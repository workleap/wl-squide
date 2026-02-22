# ADR-0029: Incremental CI via Turborepo Git Filters

## Status

proposed

## Context

As the monorepo grows, running the full build, lint, typecheck, and test suite on every pull request becomes increasingly expensive. Most PRs only touch a subset of packages. Running unchanged packages wastes CI minutes, increases feedback time, and creates unnecessary queuing.

## Options Considered

1. **Full CI on every PR** — Simple and predictable, but scales poorly. Every PR pays the cost of the entire monorepo regardless of what changed.
2. **Manual path filters via GitHub Actions `paths`** — Use `on.pull_request.paths` to skip the entire workflow. Too coarse — skips all checks if the changed path isn't listed, and doesn't handle transitive dependencies.
3. **Turborepo `--filter` with git SHA comparison** — Use `--filter=...[$base_sha]` to only run tasks for packages that diverge from the PR base commit. Turborepo understands the dependency graph and includes transitively affected packages.

## Decision

Option 3. The CI workflow uses `--filter=...[${{ github.event.pull_request.base.sha }}]` for PR builds and the full suite for pushes to `main`. This pattern is applied to build, ESLint, typecheck, and test steps independently. The checkout step uses `fetch-depth: 0` to ensure the full git history is available for SHA comparison.

Evidence: `.github/workflows/ci.yml` — each step conditionally applies the filter: `pnpm turbo run build --filter={./packages/*}...[${{ github.event.pull_request.base.sha }}]` for PRs vs. `pnpm build-pkg` for main. The same pattern applies to `eslint`, `typecheck`, and `test` steps. Turborepo cache (ADR-0016) complements this by caching results of previously run tasks.

## Consequences

- PR CI times scale with the size of the change, not the size of the monorepo.
- Transitively affected packages are automatically included — if Package A changes and Package B depends on it, both are rebuilt.
- Pushes to `main` still run the full suite, ensuring no regressions are missed on the primary branch.
- Requires `fetch-depth: 0` on checkout, which increases clone time but is necessary for accurate git diff comparison.
