`@squide/*` — modular React application shell framework. Monorepo: **pnpm workspaces** + **Turborepo**.

## Agent Memory

**Never guess how this repository works — even when you feel confident.** It has custom commands, non-standard patterns, and deliberate architectural decisions that differ from common defaults.

1. Read the relevant document from the index below before proceeding. If no entry matches, scan the summaries for related keywords.
2. Before API, dependency, or inter-module changes, read [adr/index.md](./agent-docs/adr/index.md). To reverse a decision, supersede the record — do not silently ignore it.
3. Before changing build tooling, CI pipelines, or agent workflows, read [odr/index.md](./agent-docs/odr/index.md).

## Documentation Index

### Architecture

- [ARCHITECTURE.md](./agent-docs/ARCHITECTURE.md) — What Squide is, repository structure, key concepts (FireflyRuntime, bootstrapping lifecycle, modules, runtime environment variables), sample apps

### Design

- [routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md) — Route types (public, protected, hoisted, nested), navigation items, AppRouter
- [data-fetching.md](./agent-docs/docs/design/data-fetching.md) — TanStack Query, usePublicDataQueries, useProtectedDataQueries, orchestration flow, error handling, error boundaries
- [deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md) — Two-phase registration, conditional routes/nav based on data, feature flags, or LaunchDarkly
- [cross-module-communication.md](./agent-docs/docs/design/cross-module-communication.md) — Event bus (pub/sub), plugins, shared types

### References

- [development.md](./agent-docs/docs/references/development.md) — pnpm workspace rules, env vars, JIT packages, dependency versioning, Retype docs, pre-commit hook, full command reference, adding packages
- [agent-skills.md](./agent-docs/docs/references/agent-skills.md) — Skill directories, editing skills
- [build-tooling.md](./agent-docs/docs/references/build-tooling.md) — Rslib, Rsbuild, Turborepo task graph, shared configs
- [ci-cd.md](./agent-docs/docs/references/ci-cd.md) — GitHub Actions workflows, concurrency, caching, dogfood workflow, smoke tests
- [release-process.md](./agent-docs/docs/references/release-process.md) — Changesets workflow, changelogs, npm publishing, PR preview packages
- [writing-agent-instructions.md](./agent-docs/docs/references/writing-agent-instructions.md) — Principles for writing instructions agents follow, CLAUDE.md design rules

### Quality

- [testing.md](./agent-docs/docs/quality/testing.md) — Vitest, smoke tests, browser validation, test infrastructure

### Other

- [specs/README.md](./agent-docs/docs/specs/README.md) — All `@squide/*` packages: key APIs, source locations (i18next, MSW, LaunchDarkly, module federation, Storybook)
- [adr/README.md](./agent-docs/adr/README.md) — Creating ADRs: when to write, template, status lifecycle
- [odr/README.md](./agent-docs/odr/README.md) — Creating ODRs: when to write, template, status lifecycle
