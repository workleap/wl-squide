# Package Specifications

Detailed specifications and API documentation for `@squide/*` packages.

## Core Runtime

| Package | Path | Key APIs |
|---------|------|----------|
| `@squide/core` | `packages/core` | `FireflyRuntime`, event bus, logging, plugins |
| `@squide/react-router` | `packages/react-router` | Route/navigation registration, `useNavigationItems`, `useRenderedNavigationItems` |
| `@squide/firefly` | `packages/firefly` | `initializeFirefly`, `AppRouter`, `useIsBootstrapping`, data fetching hooks |

## Integrations

| Package | Path | Key APIs |
|---------|------|----------|
| `@squide/env-vars` | `packages/env-vars` | `useEnvironmentVariable`, `useEnvironmentVariables` |
| `@squide/i18next` | `packages/i18next` | `i18nextPlugin`, `useChangeLanguage`, `useCurrentLanguage` |
| `@squide/launch-darkly` | `packages/launch-darkly` | `useFeatureFlag`, `useFeatureFlags`, `getFeatureFlag` |
| `@squide/msw` | `packages/msw` | `MswPlugin`, request handler registration |
| `@squide/fakes` | `packages/fakes` | `LocalStorageSessionManager`, `InMemoryLaunchDarklyClient` |

## Source Layout

Each package follows: `packages/<name>/src/` for source, `packages/<name>/tests/` for tests.
Every package has its own `package.json`, `tsconfig.json`, and `vitest.config.ts`.

Full API reference is in the user-facing docs: `docs/reference/`.

---
*See [AGENTS.md](../../../AGENTS.md) for navigation.*
