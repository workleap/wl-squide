# Navigation Map

> Routes AI agents to the right document — does not contain detailed instructions.

## Repository Identity

`@squide/*` packages — modular React application shell framework. Monorepo with **pnpm workspaces** + **Turborepo**.

## Agent Memory

**Never guess how this repository works — even when you feel confident.** It has custom commands, non-standard patterns, and deliberate architectural decisions that differ from common defaults.

Before you start any task:

1. Find the relevant document in the index below and read it before proceeding. If your task doesn't match any entry, scan the content summaries for relevant concepts or APIs.
2. Before modifying any package's public API, adding a dependency, or changing how modules communicate, read [adr/index.md](./agent-docs/adr/index.md) for architectural decisions. To reverse a prior decision, supersede the original record — do not silently ignore it.
3. Before changing build tooling, CI pipelines, or agent workflows, read [odr/index.md](./agent-docs/odr/index.md) for operational decisions.

## Documentation Index

### Architecture

- [ARCHITECTURE.md](./agent-docs/ARCHITECTURE.md) — What Squide is, repository structure, key concepts (FireflyRuntime, bootstrapping lifecycle, modules, runtime environment variables), sample apps

### Design

- [routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md) — Route types (public, protected, hoisted, nested), navigation items, AppRouter
- [data-fetching.md](./agent-docs/docs/design/data-fetching.md) — usePublicDataQueries, useProtectedDataQueries, orchestration flow, error handling, error boundaries
- [deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md) — Two-phase registration, conditional routes/nav based on data or feature flags
- [cross-module-communication.md](./agent-docs/docs/design/cross-module-communication.md) — Event bus (pub/sub), plugins, shared types

### References

- [development.md](./agent-docs/docs/references/development.md) — pnpm workspace rules, env vars, JIT packages, dependency versioning, Retype docs, pre-commit hook, full command reference, adding packages
- [agent-skills.md](./agent-docs/docs/references/agent-skills.md) — Skill directories, editing skills
- [build-tooling.md](./agent-docs/docs/references/build-tooling.md) — Rslib, Turborepo task graph, shared configs
- [ci-cd.md](./agent-docs/docs/references/ci-cd.md) — GitHub Actions workflows, concurrency, caching, dogfood workflow
- [release-process.md](./agent-docs/docs/references/release-process.md) — Changesets workflow, npm publishing, PR preview packages
- [writing-agent-instructions.md](./agent-docs/docs/references/writing-agent-instructions.md) — Principles for writing instructions agents follow
- [specs/README.md](./agent-docs/docs/specs/README.md) — All `@squide/*` packages: key APIs, source locations (i18next, MSW, LaunchDarkly, module federation, Storybook)

### Quality

- [testing.md](./agent-docs/docs/quality/testing.md) — Validation steps, browser validation, test infrastructure
