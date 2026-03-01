# Operational Decisions

> Quick-reference for agents. Each line is a deliberate decision — read the linked ODR only if you need the full rationale.

## Build & Tooling

| Decision | ODR |
|---|---|
| JIT packages: dev `exports` point to raw `.ts` source; `publishConfig.exports` override to compiled `dist/` at publish time. | [0001](./0001-jit-packages-pattern.md) |
| All packages build with Rslib using shared config from `@workleap/rslib-configs`. No tsup. | [0002](./0002-rslib-for-library-builds.md) |
| Type checking uses `tsgo` (`@typescript/native-preview`), not `tsc`. | [0003](./0003-tsgo-for-type-checking.md) |
| Unit tests use Vitest with per-package `vitest.config.ts`. DOM tests use `happy-dom`. No Jest. | [0006](./0006-vitest-for-unit-testing.md) |

## CI & Infrastructure

| Decision | ODR |
|---|---|
| Agent workflows use the lean YML + markdown prompt pattern. The `.yml` file handles infrastructure only; the `.md` prompt file is the source of truth for logic. | [0004](./0004-lean-yml-markdown-prompt-pattern.md) |
| Turborepo caching uses `actions/cache/restore` + `actions/cache/save` with SHA-based keys and 2-level cascade fallback. No Vercel remote cache. | [0005](./0005-github-actions-cache-for-turborepo.md) |
| PR builds use `--filter=...[$base_sha]` for incremental CI. Main-branch pushes run the full suite. `fetch-depth: 0` is required. | [0007](./0007-incremental-ci-turborepo-git-filters.md) |
| AI-driven browser QA: smoke tests on PRs (fixed page list, PASS/FAIL) and monthly dogfood sessions (exploratory, files issues). Both use `agent-browser`. | [0009](./0009-ai-driven-browser-qa-in-ci.md) |

## Agent Documentation

| Decision | ODR |
|---|---|
| Skill SKILL.md body keeps only critical patterns; everything else lives in reference files. Body should not grow past ~250 lines. | [0008](./0008-skill-body-reference-split.md) |
| CLAUDE.md uses a single Documentation Index with keyword summaries — never a separate routing table. Section anchors are added only for files over ~80 lines with distinct, high-frequency sub-tasks. Never add folder links to category headings. Keep the file under ~55 lines. | [0010](./0010-claude-md-progressive-disclosure-design.md) |
