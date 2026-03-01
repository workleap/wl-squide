# Navigation Map

> Routes AI agents to the right document — does not contain detailed instructions.

## Repository Identity

`@squide/*` packages — modular React application shell framework. Monorepo with **pnpm workspaces** + **Turborepo**.

## Agent Memory

The `agent-docs/` folder is your **memory** for this repository. It contains architecture documentation, design patterns, development commands, build tooling details, CI/CD workflows, ADRs, and package specifications.

**Never guess how this repository works.** This monorepo has custom commands, non-standard patterns, and deliberate architectural decisions that differ from common defaults. Even when you feel confident you know the answer, look it up in `agent-docs/` first — your general knowledge will be wrong often enough that guessing is never worth the risk.

Before you start any task:

1. Find the relevant document in the index below and read it before proceeding. If your task doesn't match any entry, scan the content summaries for relevant concepts or APIs.
2. Before modifying any package's public API, adding a dependency, or changing how modules communicate, read [constraints.md](./agent-docs/docs/references/constraints.md) for hard guardrails. If you need the full rationale behind a constraint, follow its ADR link. To reverse a prior decision, supersede the original ADR — do not silently ignore it.

## Documentation Index

### Architecture — [ARCHITECTURE.md](./agent-docs/ARCHITECTURE.md)

- [What is Squide?](./agent-docs/ARCHITECTURE.md#what-is-squide)
- [Repository structure](./agent-docs/ARCHITECTURE.md#repository-structure)
- [Key concepts](./agent-docs/ARCHITECTURE.md#key-concepts)
- [Sample applications](./agent-docs/ARCHITECTURE.md#sample-applications)

### Design — [docs/design/](./agent-docs/docs/design/)

- [routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md) — Route types (public, protected, hoisted, nested), navigation items, AppRouter
- [data-fetching.md](./agent-docs/docs/design/data-fetching.md) — usePublicDataQueries, useProtectedDataQueries, orchestration flow, error handling
- [deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md) — Two-phase registration, conditional routes/nav based on data or feature flags
- [cross-module-communication.md](./agent-docs/docs/design/cross-module-communication.md) — Event bus (pub/sub), plugins, shared types

### References — [docs/references/](./agent-docs/docs/references/)

- [development.md](./agent-docs/docs/references/development.md) — Setup, env vars, pnpm workspace rules, [full command reference](./agent-docs/docs/references/development.md#full-command-reference), [adding packages](./agent-docs/docs/references/development.md#adding-a-new-package), [Retype docs](./agent-docs/docs/references/development.md#retype-documentation)
- [agent-skills.md](./agent-docs/docs/references/agent-skills.md) — Skill directories, [editing skills](./agent-docs/docs/references/agent-skills.md#editing-skills)
- [build-tooling.md](./agent-docs/docs/references/build-tooling.md) — Rslib, Turborepo task graph, shared configs
- [ci-cd.md](./agent-docs/docs/references/ci-cd.md) — GitHub Actions workflows, concurrency, caching, [dogfood workflow](./agent-docs/docs/references/ci-cd.md#dogfood-workflow)
- [release-process.md](./agent-docs/docs/references/release-process.md) — Changesets workflow, npm publishing, PR preview packages
- [writing-agent-instructions.md](./agent-docs/docs/references/writing-agent-instructions.md) — Principles for writing instructions agents follow
- [constraints.md](./agent-docs/docs/references/constraints.md) — Hard architectural guardrails (compact, links to ADRs for rationale)

### Quality — [docs/quality/](./agent-docs/docs/quality/)

- [testing.md](./agent-docs/docs/quality/testing.md) — Validation steps, browser validation, test infrastructure

### Other

- [specs/](./agent-docs/docs/specs/) — All `@squide/*` packages: key APIs, source locations
