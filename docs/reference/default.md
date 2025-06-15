---
order: 60
toc:
    depth: 2-3
---

# Reference

## Artefacts

- [Packages](./packages.md)

## API

### Runtime

- [FireflyRuntime class](./runtime/runtime-class.md)
- [FireflyProvider](./runtime/FireflyProvider.md)
- [useRuntime](./runtime/useRuntime.md)
- [useRuntimeMode](./runtime/useRuntimeMode.md)
- [useRoutes](./runtime/useRoutes.md)
- [useNavigationItems](./runtime/useNavigationItems.md)
- [useLogger](./runtime/useLogger.md)
- [usePlugin](./runtime/usePlugin.md)

### Registration

- [initializeFirefly](./registration/initializeFirefly.md)
- [registerLocalModules](./registration/registerLocalModules.md) [!badge variant="secondary" size="xs" text="deprecated"]
- [registerRemoteModules](./registration/registerRemoteModules.md) [!badge variant="secondary" size="xs" text="deprecated"]
- [useDeferredRegistrations](./registration/useDeferredRegistrations.md)
- [mergeDeferredRegistrations](./registration/mergeDeferredRegistrations.md)

### Routing

- [AppRouter](./routing/AppRouter.md)
- [PublicRoutes](./routing/publicRoutes.md)
- [ProtectedRoutes](./routing/protectedRoutes.md)
- [useRenderedNavigationItems](./routing/useRenderedNavigationItems.md)
- [useIsBoostrapping](./routing/useIsBootstrapping.md)
- [useRouteMatch](./routing/useRouteMatch.md)
- [useIsRouteProtected](./routing/useIsRouteProtected.md)
- [resolveRouteSegments](./routing/resolveRouteSegments.md)
- [isNavigationLink](./routing/isNavigationLink.md)

### Logging

- [Logger](./logging/Logger.md)
- [ConsoleLogger](./logging/ConsoleLogger.md)

### Messaging

- [EventBus](./messaging/EventBus.md)
- [useEventBusDispatcher](./messaging/useEventBusDispatcher.md)
- [useEventBusListener](./messaging/useEventBusListener.md)

### TanStack Query

- [usePublicDataQueries](./tanstack-query/usePublicDataQueries.md)
- [useProtectedDataQueries](./tanstack-query/useProtectedDataQueries.md)
- [isGlobalDataQueriesError](./tanstack-query/isGlobalDataQueriesError.md)

### Mock Service Worker

- [setMswAsReady](./msw/setMswAsReady.md) [!badge variant="secondary" size="xs" text="deprecated"]

### i18next

- [i18nextPlugin](./i18next/i18nextPlugin.md)
- [getI18nextPlugin](./i18next/getI18nextPlugin.md)
- [useChangeLanguage](./i18next/useChangeLanguage.md)
- [useCurrentLanguage](./i18next/useCurrentLanguage.md)
- [useI18nextInstance](./i18next/useI18nextInstance.md)
- [I18nextNavigationItemLabel](./i18next/I18nextNavigationItemLabel.md)

### Environment variables

- [EnvironmentVariablesPlugin](./env-vars/EnvironmentVariablesPlugin.md)
- [getEnvironmentVariablesPlugin](./env-vars/getEnvironmentVariablesPlugin.md)
- [useEnvironmentVariable](./env-vars/useEnvironmentVariable.md)
- [useEnvironmentVariables](./env-vars/useEnvironmentVariables.md)

### Plugins

- [Plugin](./plugins/plugin.md)

### Fakes

Squide offers a collection of fake implementations designed to facilitate the set up of a module isolated environment.

- [LocalStorageSessionManager](./fakes/localStorageSessionManager.md)
- [ReadonlySessionLocalStorage](./fakes/readonlySessionLocalStorage.md)

### webpack

- [defineDevHostConfig](./webpack/defineDevHostConfig.md)
- [defineDevRemoteModuleConfig](./webpack/defineDevRemoteModuleConfig.md)
- [defineBuildHostConfig](./webpack/defineBuildHostConfig.md)
- [defineBuildRemoteModuleConfig](./webpack/defineBuildRemoteModuleConfig.md)

### Rsbuild

- [defineDevHostConfig](./rsbuild/defineDevHostConfig.md) [!badge variant="danger" size="xs" text="experimental"]
- [defineDevRemoteModuleConfig](./rsbuild/defineDevRemoteModuleConfig.md) [!badge variant="danger" size="xs" text="experimental"]
- [defineBuildHostConfig](./rsbuild/defineBuildHostConfig.md) [!badge variant="danger" size="xs" text="experimental"]
- [defineBuildRemoteModuleConfig](./rsbuild/defineBuildRemoteModuleConfig.md) [!badge variant="danger" size="xs" text="experimental"]

### Miscellaneous

- [usePublicDataHandler](./miscellaneous/usePublicDataHandler.md)
- [useProtectedDataHandler](./miscellaneous/useProtectedDataHandler.md)
