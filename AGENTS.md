# AGENTS.md — Navigation Map

> This file is a table of contents for AI agents working in this repository.
> It routes you to the right document — it does not contain detailed instructions.

## Repository Identity

**wl-squide** is a modular React application shell framework published as `@squide/*` packages.
It provides runtime APIs for structuring frontend applications as collections of independent
modules, each responsible for a domain. Monorepo managed with **pnpm workspaces** and **Turborepo**.

## Agent Memory

The `agent-docs/` folder is your **memory** for this repository. It contains architecture documentation, design patterns, development commands, build tooling details, CI/CD workflows, ADRs, and package specifications.

**Never guess how this repository works.** This monorepo has custom commands, non-standard patterns, and deliberate architectural decisions that differ from common defaults. Even when you feel confident you know the answer, look it up in `agent-docs/` first — your general knowledge will be wrong often enough that guessing is never worth the risk.

Before you start any task:

1. Match your task to the routing table below and read the linked document before proceeding.
2. Load the matching [agent skills](./agent-docs/docs/references/agent-skills.md). Never start writing code until skills are loaded — your general knowledge of these tools is wrong for this repo.
3. Before modifying any package's public API, adding a dependency, or changing how modules communicate, read the [ADR index](./agent-docs/adr/README.md) and check for conflicting decisions. Ignoring an existing ADR will produce code that contradicts deliberate architectural choices. To reverse a prior decision, supersede the original ADR — do not silently ignore it.

## If You Are Working On…

| Task | Start Here |
|------|------------|
| Running a command (install, build, reset, test, lint, deploy, etc.) | [development.md → Full Command Reference](./agent-docs/docs/references/development.md#full-command-reference) |
| Development setup, env vars | [development.md](./agent-docs/docs/references/development.md) |
| Understanding the framework | [ARCHITECTURE.md](./agent-docs/ARCHITECTURE.md) |
| Route or navigation registration | [routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md) |
| Global data fetching | [data-fetching.md](./agent-docs/docs/design/data-fetching.md) |
| Deferred / conditional registrations | [deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md) |
| Event bus / cross-module communication | [cross-module-communication.md](./agent-docs/docs/design/cross-module-communication.md) |
| Integrations (i18n, MSW, LaunchDarkly) | [ARCHITECTURE.md → Integrations](./agent-docs/ARCHITECTURE.md#integrations) |
| Environment variables | [ARCHITECTURE.md → Environment Variables](./agent-docs/ARCHITECTURE.md#environment-variables) |
| Adding or modifying a `@squide/*` package | [specs/](./agent-docs/docs/specs/) |
| Adding a new package to the monorepo | [development.md → Adding a New Package](./agent-docs/docs/references/development.md#adding-a-new-package) |
| React performance optimization | [agent-skills.md](./agent-docs/docs/references/agent-skills.md) |
| Build or bundling configuration | [build-tooling.md](./agent-docs/docs/references/build-tooling.md) |
| CI/CD workflows | [ci-cd.md](./agent-docs/docs/references/ci-cd.md) |
| Release process | [release-process.md](./agent-docs/docs/references/release-process.md) |
| Testing | [testing.md](./agent-docs/docs/quality/testing.md) |
| Sample applications | [ARCHITECTURE.md → Sample Applications](./agent-docs/ARCHITECTURE.md#sample-applications) |
| Editing user-facing documentation (docs/) | [development.md → Retype](./agent-docs/docs/references/development.md#retype-documentation) |
| Editing or optimizing agent skills | [agent-skills.md → Editing Skills](./agent-docs/docs/references/agent-skills.md#editing-skills) |
| Writing or editing agent instructions | [writing-agent-instructions.md](./agent-docs/docs/references/writing-agent-instructions.md) |

## agent-docs/ Table of Contents

### [docs/design/](./agent-docs/docs/design/) — Design Patterns

| Document | Content |
|----------|---------|
| [routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md) | Route types (public, protected, hoisted, nested), navigation items, AppRouter |
| [data-fetching.md](./agent-docs/docs/design/data-fetching.md) | usePublicDataQueries, useProtectedDataQueries, orchestration flow, error handling |
| [deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md) | Two-phase registration, conditional routes/nav based on data or feature flags |
| [cross-module-communication.md](./agent-docs/docs/design/cross-module-communication.md) | Event bus (pub/sub), plugins, shared types |

### [docs/specs/](./agent-docs/docs/specs/) — Package Specifications

Lists all `@squide/*` packages with their key APIs and source locations.

### [docs/references/](./agent-docs/docs/references/) — Infrastructure & Tooling

| Document | Content |
|----------|---------|
| [agent-skills.md](./agent-docs/docs/references/agent-skills.md) | Required agent skills to load before working in this repo |
| [development.md](./agent-docs/docs/references/development.md) | Setup, env vars, pnpm workspace rules, full command reference, adding packages |
| [build-tooling.md](./agent-docs/docs/references/build-tooling.md) | Rslib, Turborepo task graph, shared configs |
| [ci-cd.md](./agent-docs/docs/references/ci-cd.md) | All GitHub Actions workflows, concurrency, caching |
| [release-process.md](./agent-docs/docs/references/release-process.md) | Changesets workflow, npm publishing, PR previews |
| [writing-agent-instructions.md](./agent-docs/docs/references/writing-agent-instructions.md) | Principles for writing instructions agents actually follow |

### [docs/quality/](./agent-docs/docs/quality/) — Quality

| Document | Content |
|----------|---------|
| [testing.md](./agent-docs/docs/quality/testing.md) | How to validate changes, test infrastructure |

### [adr/](./agent-docs/adr/) — Architecture Decision Records

Captures rationale behind significant decisions. Read before making architectural choices, write new ADRs when introducing patterns, replacing dependencies, or choosing between viable approaches. See [adr/README.md](./agent-docs/adr/README.md) for process and template.

## Maintenance

This documentation is automatically maintained by the
[update-agent-docs](./.github/workflows/update-agent-docs.yml) workflow.
It runs on push to main (code changes and workflow changes) and can be triggered manually.

---
*Auto-maintained. Last structure version: 2.0*
