# ADR-0015: Lean YML + Markdown Prompt Pattern for Agent Workflows

## Status

accepted

## Context

Multiple GitHub Actions workflows use Claude Code agents for automated tasks (code review, dependency updates, documentation updates, monorepo audits, skill synchronization). The agent logic (what to analyze, how to decide, what to output) needs to live somewhere.

## Options Considered

1. **Inline in the workflow YML** — All logic embedded as a multi-line `prompt:` string in the workflow file. Simple but hard to read, review, and maintain.
2. **External script** — A shell or Node script that orchestrates the agent. Adds a layer of indirection.
3. **Lean YML + markdown prompt** — Workflow files handle only infrastructure (checkout, install node, configure git). All agent logic lives in `.github/prompts/*.md` files, loaded via `Read and follow the instructions in .github/prompts/<name>.md`.

## Decision

Option 3. Every agent workflow follows this pattern:
- The `.yml` file does checkout, tool installation, git config, and a single `claude-code-action` step.
- The `.md` file contains the full agent instructions: steps, rules, context, output format.

Five agent workflows follow this pattern, each with a 1:1 matching prompt file:

| Workflow | Prompt File | Complexity |
|----------|-------------|------------|
| `code-review.yml` | `code-review.md` (43 lines) | Concise: severity levels, inline PR comments |
| `audit-monorepo.yml` | `audit-monorepo.md` (94 lines) | Multi-step with subagent validation, creates GitHub issues |
| `sync-agent-skill.yml` | `sync-agent-skill.md` (134 lines) | Multi-step with subagent validation and version bumping |
| `update-agent-docs.yml` | `update-agent-docs.md` (156 lines) | Multi-step with subagent coherence validation, creates PRs |
| `update-dependencies.yml` | `update-dependencies.md` (164 lines) | Most complex: validation loop with browser testing, changeset creation |

The remaining workflows (`ci.yml`, `pr-pkg.yml`, `changeset.yml`, `retype-action.yml`) are traditional CI pipelines without agents. `claude.yml` is a generic claude-code-action step without a dedicated prompt file (used for ad-hoc PR interactions).

Evidence: All 5 agent workflow files in `.github/workflows/` use `prompt: "Read and follow the instructions in .github/prompts/<name>.md"`. All 5 prompt files in `.github/prompts/` have a matching workflow. Perfect 1:1 alignment.

## Consequences

- Prompts are reviewable as standalone markdown files in PRs — prompt logic changes are visible in diff without YML noise.
- Workflow infrastructure changes (checkout, Node version, git config) are separated from prompt logic changes.
- The markdown format is readable by both humans and agents.
- Prompt complexity varies widely (43-164 lines), but the pattern scales — the workflow file stays lean regardless of prompt size.
- Adding a new agent workflow means creating two files: a lean `.yml` and a detailed `.md`.
