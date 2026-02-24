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

### FireflyRuntime

The central runtime object, instantiated via `initializeFirefly()`. It manages:
- Module registration (local modules array)
- Route and navigation item registration
- Event bus (pub/sub cross-module communication)
- Logging (structured logger abstraction)
- Environment variables (runtime-attached, not `process.env`)
- Feature flags (LaunchDarkly integration)
- Plugins (extensibility)

### Modules

A module is a domain-specific unit that exports a **register function** (`ModuleRegisterFunction`).
Modules are autonomous: they do not import from other modules. Coordination happens only through the
runtime API (event bus, shared types, registered routes/navigation).

### Two-Phase Registration

1. **Initial registration** — runs at bootstrap, registers routes and navigation items.
2. **Deferred registration** — the register function can return a callback that re-runs when
   global data or feature flags change, enabling conditional routes and navigation items.

### AppRouter

Wraps React Router. Assembles registered routes from all modules and orchestrates the data
fetching lifecycle (`waitForPublicData`, `waitForProtectedData`). Works with `useIsBootstrapping()`
to show loading state until modules, MSW, and global data are ready.

### Global Data Fetching

Built on **TanStack Query**:
- `usePublicDataQueries` — fetches data needed before rendering any page.
- `useProtectedDataQueries` — fetches auth-required data (session, permissions); detects 401s.
- AppRouter orchestrates the order: public data → protected data → page render.
- Deferred registrations automatically re-execute when query data updates.

### Route Types

| Type | Description |
|------|-------------|
| Protected (default) | Require authentication, render under `ProtectedRoutes` placeholder |
| Public | No auth, render under `PublicRoutes` placeholder |
| Hoisted | Raised to root level, bypass layouts (e.g., login page) |
| Nested | Nested under a parent by `parentPath` or `parentId` |

### Environment Variables

Attached to the runtime, not `process.env`. Registered via `initializeFirefly({ environmentVariables })`
or `runtime.registerVariable()`. Retrieved with `useEnvironmentVariable()` hook or
`runtime.getEnvironmentVariable()`. Type-safe via `EnvironmentVariables` interface augmentation.

## Package Domains

### Core Runtime

| Package | Path | Purpose |
|---------|------|---------|
| `@squide/core` | `packages/core` | Runtime abstractions, event bus, logging, plugins |
| `@squide/react-router` | `packages/react-router` | React Router integration, route/navigation registration |
| `@squide/firefly` | `packages/firefly` | Main bundle: core + react-router + TanStack Query |

### Integrations

| Package | Path | Purpose |
|---------|------|---------|
| `@squide/env-vars` | `packages/env-vars` | Runtime environment variables |
| `@squide/i18next` | `packages/i18next` | i18next plugin for cross-module language sync |
| `@squide/launch-darkly` | `packages/launch-darkly` | Feature flag integration with streaming |
| `@squide/msw` | `packages/msw` | Mock Service Worker for dev API mocking |
| `@squide/fakes` | `packages/fakes` | Fake implementations (sessions, LaunchDarkly clients) |

### Build Tooling (internal)

| Package | Path | Purpose |
|---------|------|---------|
| `@squide/firefly-rsbuild-configs` | `packages/firefly-rsbuild-configs` | Rsbuild configuration presets |
| `@squide/firefly-webpack-configs` | `packages/firefly-webpack-configs` | Webpack configuration presets |
| `@squide/firefly-rsbuild-storybook` | `packages/firefly-rsbuild-storybook` | Storybook + Rsbuild integration |
| `@squide/firefly-module-federation` | `packages/firefly-module-federation` | Module Federation runtime (legacy) |

## Sample Applications

| Sample | Path | Highlights |
|--------|------|------------|
| basic | `samples/basic/` | Host + local + remote modules with Rsbuild |
| basic-webpack | `samples/basic-webpack/` | Webpack variant |
| endpoints | `samples/endpoints/` | Data fetching, i18n, Express BFF server |
| storybook | `samples/storybook/` | Storybook integration demo |

Each sample follows: **host** → **shell** (layout, bootstrapping route) → **modules** (local and/or remote) with a **shared** package for types.

## Related Documentation

- Routing and navigation patterns: [agent-docs/docs/design/routing-and-navigation.md](./agent-docs/docs/design/routing-and-navigation.md)
- Data fetching patterns: [agent-docs/docs/design/data-fetching.md](./agent-docs/docs/design/data-fetching.md)
- Deferred registrations: [agent-docs/docs/design/deferred-registrations.md](./agent-docs/docs/design/deferred-registrations.md)
- CI/CD pipeline: [agent-docs/docs/references/ci-cd.md](./agent-docs/docs/references/ci-cd.md)
- Testing strategy: [agent-docs/docs/quality/testing.md](./agent-docs/docs/quality/testing.md)

---
*Auto-maintained. See [AGENTS.md](./AGENTS.md) for navigation.*
