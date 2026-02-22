# ADR-0015: Lean YML + Markdown Prompt Pattern for Agent Workflows

## Status

accepted

## Context

Multiple GitHub Actions workflows use Claude Code agents for automated tasks (code review, dependency updates, documentation updates, monorepo audits). The agent logic (what to analyze, how to decide, what to output) needs to live somewhere.

## Options Considered

1. **Inline in the workflow YML** — All logic embedded as a multi-line `prompt:` string in the workflow file. Simple but hard to read, review, and maintain.
2. **External script** — A shell or Node script that orchestrates the agent. Adds a layer of indirection.
3. **Lean YML + markdown prompt** — Workflow files handle only infrastructure (checkout, install node, configure git). All agent logic lives in `.github/prompts/*.md` files, loaded via `Read and follow the instructions in .github/prompts/<name>.md`.

## Decision

Option 3. Every agent workflow follows this pattern:
- The `.yml` file does checkout, tool installation, git config, and a single `claude-code-action` step.
- The `.md` file contains the full agent instructions: steps, rules, context, output format.

Evidence: `code-review.yml`, `update-dependencies.yml`, `update-agent-docs.yml`, and `audit-monorepo.yml` all follow this pattern.

## Consequences

- Prompts are reviewable as standalone markdown files in PRs.
- Workflow infrastructure changes are separated from prompt logic changes.
- The markdown format is readable by both humans and agents.
- Each workflow has a matching prompt file in `.github/prompts/`.
