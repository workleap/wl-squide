# Architecture Overview

## What is Squide?

Squide is a **React modular application shell** for Workleap web applications. It provides runtime
APIs for structuring frontend apps as collections of **independent modules**, each responsible for
a specific domain or subdomain. Modules register routes, navigation items, and services through the
**FireflyRuntime** — they never directly reference each other.

Squide is an **application framework**, not a bundler or micro-frontend tool. It is agnostic to
how modules are deployed; the recommended approach is **local modules** (sibling packages in a
monorepo).

## Repository Structure

```
wl-squide/
├── packages/          # Publishable @squide/* packages
├── samples/           # Demo applications (4 variants)
├── templates/         # Starter project templates
├── docs/              # User-facing documentation (Retype)
├── .github/           # CI/CD workflows and prompts
├── agent-docs/        # AI agent detailed documentation
├── turbo.json         # Turborepo task graph
└── pnpm-workspace.yaml
```

## Key Concepts

For detailed patterns and APIs, read the design docs linked below. This section provides quick definitions only.

- **FireflyRuntime** — Central runtime object (`initializeFirefly()`). Manages module registration, routes, navigation, event bus, logging, env vars, feature flags, and plugins.
- **Modules** — Domain-specific units exporting a register function (`ModuleRegisterFunction`). Autonomous — they never import from other modules.
- **Two-Phase Registration** — (1) Initial registration at bootstrap, (2) deferred registration re-runs when global data or feature flags change. See [deferred-registrations.md](./docs/design/deferred-registrations.md).
- **AppRouter** — Wraps React Router, assembles routes from all modules, orchestrates data fetching lifecycle. See [routing-and-navigation.md](./docs/design/routing-and-navigation.md).
- **Global Data Fetching** — Built on TanStack Query (`usePublicDataQueries`, `useProtectedDataQueries`). See [data-fetching.md](./docs/design/data-fetching.md).
- **Route Types** — Protected (default), Public, Hoisted, Nested. See [routing-and-navigation.md](./docs/design/routing-and-navigation.md).
- **Environment Variables** — Runtime-attached (not `process.env`). Registered via `initializeFirefly()` or `runtime.registerVariable()`.
- **Cross-Module Communication** — Event bus (pub/sub), plugins, shared types. See [cross-module-communication.md](./docs/design/cross-module-communication.md).

## Sample Applications

| Sample | Path | Highlights |
|--------|------|------------|
| basic | `samples/basic/` | Host + local + remote modules with Rsbuild |
| basic-webpack | `samples/basic-webpack/` | Webpack variant |
| endpoints | `samples/endpoints/` | Data fetching, i18n, Express BFF server |
| storybook | `samples/storybook/` | Storybook integration demo |

Each sample follows: **host** → **shell** (layout, bootstrapping route) → **modules** (local and/or remote) with a **shared** package for types.

## Further Reading

- All `@squide/*` packages and APIs: [specs/](./docs/specs/)
- See [CLAUDE.md](../CLAUDE.md) for the full documentation index.
