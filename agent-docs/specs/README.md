# Package Specifications

Detailed specifications and API documentation for `@squide/*` packages.

## Core Runtime

| Package | Path | Key APIs |
|---------|------|----------|
| `@squide/core` | `packages/core` | `Runtime` (abstract base), event bus, logging, plugins (deferred registration scope hook, optional `isReady` / `registerReadyListener` / `removeReadyListener` members), deferred registration scope started listeners |
| `@squide/react-router` | `packages/react-router` | Route/navigation registration, `useRuntimeNavigationItems`, `useRenderedNavigationItems` |
| `@squide/firefly` | `packages/firefly` | `FireflyRuntime`, `initializeFirefly`, `AppRouter`, `useIsBootstrapping`, `useNavigationItems`, data fetching hooks. The `@squide/firefly/testing` entry point exposes `createDeferredRegistrationsRunner` |

## Integrations

| Package | Path | Key APIs |
|---------|------|----------|
| `@squide/env-vars` | `packages/env-vars` | `useEnvironmentVariable`, `useEnvironmentVariables` |
| `@squide/i18next` | `packages/i18next` | `i18nextPlugin` (`registerInstance(key, instance, { loadResources? })` for per-language lazy loading, async `changeLanguage`, `isReady`), `I18nextResourcesLoadError` / `isI18nextResourcesLoadError`, `I18nextResourcesLoadFailedEvent`, `useChangeLanguage`, `useCurrentLanguage`, `useI18nextInstance` |
| `@squide/launch-darkly` | `packages/launch-darkly` | `useFeatureFlag`, `useFeatureFlags`, `getFeatureFlag`, `InMemoryLaunchDarklyClient` |
| `@squide/msw` | `packages/msw` | `MswPlugin`, request handler registration |
| `@squide/fakes` | `packages/fakes` | `LocalStorageSessionManager` |
| `@squide/firefly-storybook` | `packages/firefly-storybook` | `initializeFireflyForStorybook`, `withFireflyDecorator`, `withFeatureFlagsOverrideDecorator`, `StorybookRuntime` |
| `@squide/firefly-module-federation` | `packages/firefly-module-federation` | Maintenance-only. `initializeFirefly` wrapper with a `remotes` option, `getModuleFederationPlugin`, remote module registration events |

## Build Tooling

Published packages (`"access": "public"`), documented for consumers in `docs/reference/rsbuild/` and `docs/reference/webpack/`. Both are maintenance-only and no sample uses them: applications use `@workleap/rsbuild-configs` directly.

| Package | Path | Purpose |
|---------|------|---------|
| `@squide/firefly-rsbuild-configs` | `packages/firefly-rsbuild-configs` | Maintenance-only. Rsbuild configuration presets for Module Federation |
| `@squide/firefly-webpack-configs` | `packages/firefly-webpack-configs` | Maintenance-only. Webpack configuration presets for Module Federation |

## Source Layout

Each package follows: `packages/<name>/src/` for source, `packages/<name>/tests/` for tests.
Every package has its own `package.json` and `tsconfig.json`. All packages except `@squide/fakes` have a `vitest.config.ts` (fakes has no tests).

Full API reference is in the user-facing docs: `docs/reference/`.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
