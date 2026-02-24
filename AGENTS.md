# AGENTS.md — Navigation Map

> This file is a table of contents for AI agents working in this repository.
> It routes you to the right document — it does not contain detailed instructions.

## Repository Identity

**wl-squide** is a modular React application shell framework published as `@squide/*` packages.
It provides runtime APIs for structuring frontend applications as collections of independent
modules, each responsible for a domain. Monorepo managed with **pnpm workspaces** and **Turborepo**.

## Before You Start

1. Load the appropriate [agent skills](./agent-docs/docs/references/agent-skills.md) before doing any work.
2. Review the [Architecture Decision Records index](./agent-docs/adr/README.md) and read any ADRs relevant to your current task before making architectural decisions. To reverse a prior decision, supersede the original ADR — do not silently ignore it.

## If You Are Working On…

| Task | Start Here |
|------|------------|
| Understanding the framework | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Route or navigation registration | [routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md) |
| Global data fetching | [data-fetching.md](./agent-docs/docs/design/data-fetching.md) |
| Deferred / conditional registrations | [deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md) |
| Event bus / cross-module communication | [cross-module-communication.md](./agent-docs/docs/design/cross-module-communication.md) |
| Integrations (i18n, MSW, LaunchDarkly) | [ARCHITECTURE.md → Integrations](./ARCHITECTURE.md#integrations) |
| Environment variables | [ARCHITECTURE.md → Environment Variables](./ARCHITECTURE.md#environment-variables) |
| Adding or modifying a `@squide/*` package | [specs/](./agent-docs/docs/specs/) |
| Adding a new package to the monorepo | [development.md → Adding a New Package](./agent-docs/docs/references/development.md#adding-a-new-package) |
| React performance optimization | [agent-skills.md](./agent-docs/docs/references/agent-skills.md) |
| Development setup, env vars, commands | [development.md](./agent-docs/docs/references/development.md) |
| Build or bundling configuration | [build-tooling.md](./agent-docs/docs/references/build-tooling.md) |
| CI/CD workflows | [ci-cd.md](./agent-docs/docs/references/ci-cd.md) |
| Release process | [release-process.md](./agent-docs/docs/references/release-process.md) |
| Testing | [testing.md](./agent-docs/docs/quality/testing.md) |
| Sample applications | [ARCHITECTURE.md → Sample Applications](./ARCHITECTURE.md#sample-applications) |
| Editing or optimizing agent skills | [agent-skills.md → Editing Skills](./agent-docs/docs/references/agent-skills.md#editing-skills) |

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
