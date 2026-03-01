# Operational Decisions

> Quick-reference for agents. Each line is a deliberate decision — read the linked ODR only if you need the full rationale.

## Build & Tooling

| Decision | ODR |
|---|---|
| JIT packages: dev `exports` point to raw `.ts` source; `publishConfig.exports` override to compiled `dist/` at publish time. | [0011](./0011-jit-packages-pattern.md) |
| All packages build with Rslib using shared config from `@workleap/rslib-configs`. No tsup. | [0012](./0012-rslib-for-library-builds.md) |
| Type checking uses `tsgo` (`@typescript/native-preview`), not `tsc`. | [0014](./0014-tsgo-for-type-checking.md) |

## CI & Infrastructure

| Decision | ODR |
|---|---|
| Agent workflows use the lean YML + markdown prompt pattern. The `.yml` file handles infrastructure only; the `.md` prompt file is the source of truth for logic. | [0015](./0015-lean-yml-markdown-prompt-pattern.md) |
| Turborepo caching uses `actions/cache/restore` + `actions/cache/save` with SHA-based keys and 2-level cascade fallback. No Vercel remote cache. | [0016](./0016-github-actions-cache-for-turborepo.md) |
| PR builds use `--filter=...[$base_sha]` for incremental CI. Main-branch pushes run the full suite. `fetch-depth: 0` is required. | [0029](./0029-incremental-ci-turborepo-git-filters.md) |

## Agent Documentation

| Decision | ODR |
|---|---|
| CLAUDE.md uses a single Documentation Index with keyword summaries — never a separate routing table. Section anchors are added only for files over ~80 lines with distinct, high-frequency sub-tasks. Never add folder links to category headings. Keep the file under ~55 lines. | [0032](./0032-claude-md-progressive-disclosure-design.md) |
