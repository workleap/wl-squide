# Update Agent Documentation

You are maintaining the agent documentation for the wl-squide repository.
Your job is to keep this documentation accurate and useful for AI agents working in the codebase.

## Step 1 — Determine update scope

The trigger type is provided in the prompt that invoked you (e.g., "This run was triggered by: push" or "This run was triggered by: workflow_dispatch").

### If trigger is `push`

Run `git diff HEAD~1 --name-only` excluding paths that are not relevant:

```
git diff HEAD~1 --name-only -- \
  ':!agent-docs' ':!AGENTS.md' \
  ':!node_modules' ':!.turbo' ':!pnpm-lock.yaml' \
  ':!samples' ':!templates' ':!patches' \
  ':!.changeset' ':!user-prompts' ':!agent-skills'
```

Also run `git diff HEAD~1 --stat` with the same exclusions for a summary.

If the diff is empty (no meaningful code changes), output "No agent-docs update needed." and STOP immediately (no branch, no PR).

### If trigger is `workflow_dispatch`

The prompt includes a mode indicator (e.g., `mode: full-audit` or `mode: last-commit`).

- **`full-audit`** (default): Skip the diff. Do a full freshness audit: compare every `agent-docs/` file against the current codebase and update anything stale.
- **`last-commit`**: Behave like a `push` trigger — compute the diff from the last commit and only update affected documentation.

## Step 2 — Update documentation and check for missing ADRs

For `push` triggers, read the diff and determine which documentation files are affected by the changes. For `workflow_dispatch` triggers, review all documentation files against the current codebase.

Also check whether recent changes contain architectural decisions that lack an ADR. Read existing ADRs in `agent-docs/adr/` first. If you find a new pattern, a replaced dependency, an infrastructure change, or a choice between viable approaches — and no existing ADR covers it — write a new ADR following the process in `agent-docs/adr/README.md`. Set its status to `proposed`. When writing the ADR, follow the ADR vs docs boundary rules below — record the decision rationale, not operational details.

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
- `agent-docs/ARCHITECTURE.md` is a **high-level map** — key concepts and package domains.
- `agent-docs/docs/` is the **structured knowledge base** — categorized, detailed, but concise.

### File layout

- `AGENTS.md` — workspace root. Table of contents / navigation map.
- `CLAUDE.md` — workspace root. Points Claude to AGENTS.md (do NOT modify).
- `agent-docs/` — structured knowledge base:
  - `ARCHITECTURE.md` — high-level architecture overview
  - `docs/design/` — design patterns: routing, data fetching, registrations, communication
  - `docs/specs/` — package specifications and APIs
  - `docs/references/` — build tooling, CI/CD, infrastructure
  - `docs/quality/` — testing and quality standards
  - `adr/` — Architecture Decision Records

### Rules

- **Never rewrite sections that are already correct.** Only change lines affected by actual code changes.
- **Never add prose when a link suffices.** One line + a link. Multi-paragraph explanations belong in source-of-truth docs, not agent-docs.
- **Never write claims you cannot verify.** If you cannot confirm a fact from an actual file, omit it entirely. Do not use TODO comments as a substitute for verification — other agents will treat unverified claims as authoritative.
- **No cosmetic rewrites.** Small, focused changes only.
- **Initialize missing files.** If a referenced file does not exist, create it with a minimal structure.
- **Preserve structure.** Do not reorganize folders or rename files unless the repo structure changed.
- **Reference real paths.** Always cite actual file paths as evidence (e.g., `packages/core/src/`).
- **No duplication.** If information exists in one document, link to it from others.
- **No invention.** Only document what you can verify from actual files.
- **Never use advisory language in agent instructions.** Use prohibition framing and state consequences. See [writing-agent-instructions.md](../../agent-docs/docs/references/writing-agent-instructions.md).
- ONLY modify files under `agent-docs/` and `AGENTS.md` at the root. Modifying files outside this set will cause an infinite workflow loop.
- Do NOT modify `CLAUDE.md`.

### ADR vs docs boundary

ADRs record **why** a decision was made (the problem, the alternatives, the chosen option, and the trade-offs accepted). Operational details about **how** the decision is implemented belong in `agent-docs/docs/`.

- **Belongs in an ADR:** the problem that motivated the decision, options evaluated, which option was chosen and why, architectural trade-offs accepted.
- **Belongs in `agent-docs/docs/`:** file paths and storage locations, URL rewriting patterns, CLI commands and flags, permissions and access controls, step-by-step operational procedures, server start/build commands.

Examples:

- **Good ADR sentence:** "Evidence is stored on an orphan branch so GitHub issue links remain stable across runs. See [ci-cd.md](../docs/references/ci-cd.md) for operational details."
- **Bad ADR sentence:** "Evidence files are pushed to the `dogfood-evidence` branch using `git push --force`, and URLs are rewritten from `./screenshots/` to `https://raw.githubusercontent.com/...`."

**Never put operational details (commands, paths, configs, permissions, URL patterns) into an ADR.** State the decision and its rationale, then link to the relevant `agent-docs/docs/` file for implementation specifics. Operational content in ADRs drifts from the actual implementation and misleads agents into following stale procedures instead of reading the source of truth.

### AGENTS.md requirements

AGENTS.md must stay between 80–150 lines. It must contain:

1. **Purpose** — 1–2 short paragraphs identifying the repository.
2. **How to Navigate** — table linking to `agent-docs/ARCHITECTURE.md` and `agent-docs/docs/` categories.
3. **"If You Are Working On…"** — routing table mapping tasks to documents.

If any section grows too large, extract it into an `agent-docs/docs/` file and replace with a link.

### agent-docs/ARCHITECTURE.md requirements

`agent-docs/ARCHITECTURE.md` must contain:

1. **What is Squide** — framework identity and purpose (not a bundler/micro-frontend tool).
2. **Repository Structure** — directory tree overview.
3. **Key Concepts** — FireflyRuntime, modules, two-phase registration, AppRouter, data fetching, route types, environment variables.
4. **Package Domains** — tables grouping packages by domain (core, integrations, build tooling).
5. **Sample Applications** — table of sample apps.

## Step 3 — Validate coherence

Spawn an **opus** subagent to validate the documentation as a whole. Pass it the following instructions:

> Read all files under `agent-docs/`, plus `AGENTS.md` at the workspace root. Validate:
>
> - **Cross-references:** All markdown links between documents point to files that actually exist.
> - **Consistency:** Information is not contradicted across documents (e.g., a package listed in one place but missing or renamed in another).
> - **Stale content:** Verify that document contents align with the actual codebase (check real file paths, package names, etc.).
> - **AGENTS.md line count:** Must be between 80–150 lines.
> - **Architecture Decision Records:** Every ADR in `agent-docs/adr/` follows the template (has Status, Context, Options Considered, Decision, Consequences sections) and is listed in the `## Index` section of `agent-docs/adr/README.md`.
>
> Return a list of issues found. If no issues, return "No issues found."

If the subagent reports issues, fix them. Do not rewrite sections that are already correct.

## Step 4 — Open a pull request

Use a fixed branch name: `agent-docs/update`.

```bash
git checkout -b agent-docs/update
git add agent-docs/ AGENTS.md
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
  --body "<body>" \
  --base main \
  --head agent-docs/update
```

The PR body must follow this structure:

```markdown
## Summary

<bullet list of what changed and why>

## Test plan

<bullet list using checked checkmarks: `- [x]` (not unchecked `- [ ]`)>
```

If there are no staged changes after `git add`, output "No agent-docs update needed." and STOP.

Then STOP. You are done.
