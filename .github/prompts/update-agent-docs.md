# Update Agent Documentation

You are maintaining the agent documentation for the wl-squide repository.
Your job is to keep this documentation accurate and useful for AI agents working in the codebase.

## Step 1 — Compute the diff

Run `git diff HEAD~1 --name-only` excluding paths that are not relevant:

```
git diff HEAD~1 --name-only -- \
  ':!agent-docs' ':!AGENTS.md' ':!ARCHITECTURE.md' \
  ':!node_modules' ':!.turbo' ':!pnpm-lock.yaml' \
  ':!samples' ':!templates' ':!patches' \
  ':!.changeset' ':!user-prompts' ':!agent-skills'
```

Also run `git diff HEAD~1 --stat` with the same exclusions for a summary.

### Early exit

Stop immediately (no branch, no PR) if ANY of these are true:

- The diff is empty (no meaningful code changes).
- The last commit author is a bot (`git log -1 --format='%an'` contains `[bot]` or `changeset-bot`).

When stopping early, output "No agent-docs update needed." and STOP.

### Manual trigger (`workflow_dispatch`)

When there is no recent push context, skip the diff and instead do a full freshness audit:
compare every `agent-docs/` file against the current codebase and update anything stale.

## Step 2 — Update the documentation

Read the diff and determine which documentation files are affected by the changes.

### Context

Squide is a **React modular application shell** — an application framework for structuring frontend
apps as collections of independent modules. It is NOT a micro-frontend tool, NOT a bundler tool.

When documenting Squide:
- Focus on the **runtime APIs**: FireflyRuntime, route/navigation registration, data fetching hooks,
  event bus, plugins, environment variables, feature flags, logging.
- Do NOT emphasize module federation, webpack, rsbuild, or bundler configuration. These are
  internal build concerns, not the framework's purpose.
- Refer to the user-facing docs in `docs/` (specifically `docs/introduction/`, `docs/essentials/`,
  `docs/integrations/`, `docs/reference/`) and `CONTRIBUTING.md` as the source of truth for Squide concepts.

### Philosophy

**Map, not manual.** Documentation should route agents to the right place, not replicate the codebase.

- `AGENTS.md` is a **table of contents** — short, routing-focused, link-heavy.
- `ARCHITECTURE.md` is a **high-level map** — key concepts and package domains.
- `agent-docs/docs/` is the **structured knowledge base** — categorized, detailed, but concise.

### File layout

- `AGENTS.md` — workspace root. Table of contents / navigation map.
- `ARCHITECTURE.md` — workspace root. High-level architecture overview.
- `CLAUDE.md` — workspace root. Points Claude to AGENTS.md (do NOT modify).
- `agent-docs/` — structured knowledge base:
  - `docs/design/` — design patterns: routing, data fetching, registrations, communication
  - `docs/specs/` — package specifications and APIs
  - `docs/references/` — build tooling, CI/CD, infrastructure
  - `docs/quality/` — testing and quality standards
  - `decisions/` — Architecture Decision Records

### Rules

- **Be incremental.** Only update sections impacted by the diff.
- **Prefer links over prose.** Add a link and a one-line summary rather than a paragraph.
- **Mark uncertainty.** If you cannot verify a fact, add `<!-- TODO: verify ... -->`.
- **Keep it stable.** Small, focused changes. No cosmetic rewrites.
- **Initialize missing files.** If a referenced file does not exist, create it with a minimal structure.
- **Preserve structure.** Do not reorganize folders or rename files unless the repo structure changed.
- **Reference real paths.** Always cite actual file paths as evidence (e.g., `packages/core/src/`).
- **No duplication.** If information exists in one document, link to it from others.
- **No invention.** Only document what you can verify from actual files.
- ONLY modify files under `agent-docs/`, plus `AGENTS.md` and `ARCHITECTURE.md` at the root. Modifying files outside this set will cause an infinite workflow loop.
- Do NOT modify `CLAUDE.md`.

### AGENTS.md requirements

AGENTS.md must stay between 80–150 lines. It must contain:

1. **Purpose** — 1–2 short paragraphs identifying the repository.
2. **How to Navigate** — table linking to `ARCHITECTURE.md` and `agent-docs/docs/` categories.
3. **"If You Are Working On…"** — routing table mapping tasks to documents.

If any section grows too large, extract it into an `agent-docs/docs/` file and replace with a link.

### ARCHITECTURE.md requirements

ARCHITECTURE.md must contain:

1. **What is Squide** — framework identity and purpose (not a bundler/micro-frontend tool).
2. **Repository Structure** — directory tree overview.
3. **Key Concepts** — FireflyRuntime, modules, two-phase registration, AppRouter, data fetching, route types, environment variables.
4. **Package Domains** — tables grouping packages by domain (core, integrations, build tooling).
5. **Sample Applications** — table of sample apps.
6. **Build & Task Graph** — summary of Turborepo tasks.
7. **Technology Stack** — table of key technologies.

## Step 3 — Validate coherence

Spawn an opus subagent to validate the documentation as a whole. Pass it the following instructions:

> Read all files under `agent-docs/`, plus `AGENTS.md` and `ARCHITECTURE.md` at the workspace root. Validate:
>
> - **Cross-references:** All markdown links between documents point to files that actually exist.
> - **Consistency:** Information is not contradicted across documents (e.g., a package listed in one place but missing or renamed in another).
> - **Stale content:** Verify that document contents align with the actual codebase (check real file paths, package names, etc.).
> - **AGENTS.md line count:** Must be between 80–150 lines.
>
> Return a list of issues found. If no issues, return "No issues found."

If the subagent reports issues, fix them. Do not rewrite sections that are already correct.

## Step 4 — Open a pull request

Use a fixed branch name: `agent-docs/update`.

```bash
git checkout -b agent-docs/update
git add agent-docs/ AGENTS.md ARCHITECTURE.md
git commit -m "docs(agent-docs): update documentation [skip ci]"
git push --force origin agent-docs/update
```

Then check if a PR already exists for this branch:

```bash
gh pr list --head agent-docs/update --state open --json number --jq '.[0].number'
```

- If a PR exists, it is automatically updated by the force-push. No further action needed.
- If no PR exists, create one:

```bash
gh pr create \
  --title "docs(agent-docs): update documentation" \
  --body "<summary of what changed and why>" \
  --base main \
  --head agent-docs/update
```

If there are no staged changes after `git add`, output "No agent-docs update needed." and STOP.

Then STOP. You are done.
