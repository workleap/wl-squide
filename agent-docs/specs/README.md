# Package Specifications

Detailed specifications and API documentation for `@squide/*` packages.

## Core Runtime

| Package | Path | Key APIs |
|---------|------|----------|
| `@squide/core` | `packages/core` | `Runtime` (abstract base), event bus, logging, plugins |
| `@squide/react-router` | `packages/react-router` | Route/navigation registration, `useNavigationItems`, `useRenderedNavigationItems` |
| `@squide/firefly` | `packages/firefly` | `FireflyRuntime`, `initializeFirefly`, `AppRouter`, `useIsBootstrapping`, data fetching hooks |

## Integrations

| Package | Path | Key APIs |
|---------|------|----------|
| `@squide/env-vars` | `packages/env-vars` | `useEnvironmentVariable`, `useEnvironmentVariables` |
| `@squide/i18next` | `packages/i18next` | `i18nextPlugin`, `useChangeLanguage`, `useCurrentLanguage` |
| `@squide/launch-darkly` | `packages/launch-darkly` | `useFeatureFlag`, `useFeatureFlags`, `getFeatureFlag` |
| `@squide/msw` | `packages/msw` | `MswPlugin`, request handler registration |
| `@squide/fakes` | `packages/fakes` | `LocalStorageSessionManager`, `InMemoryLaunchDarklyClient` |

## Build Tooling (internal)

Internal packages not intended for direct consumption.

| Package | Path | Purpose |
|---------|------|---------|
| `@squide/firefly-rsbuild-configs` | `packages/firefly-rsbuild-configs` | Rsbuild configuration presets |
| `@squide/firefly-webpack-configs` | `packages/firefly-webpack-configs` | Webpack configuration presets |
| `@squide/firefly-rsbuild-storybook` | `packages/firefly-rsbuild-storybook` | Storybook + Rsbuild integration |
| `@squide/firefly-module-federation` | `packages/firefly-module-federation` | Module Federation runtime (legacy) |

## Source Layout

Each package follows: `packages/<name>/src/` for source, `packages/<name>/tests/` for tests.
Every package has its own `package.json` and `tsconfig.json`. All packages except `@squide/fakes` have a `vitest.config.ts` (fakes has no tests).

Full API reference is in the user-facing docs: `docs/reference/`.

---
*See [CLAUDE.md](../../../CLAUDE.md) for navigation.*
