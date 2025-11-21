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

- [FireflyRuntime class](./runtime/FireflyRuntime.md)
- [FireflyProvider](./runtime/FireflyProvider.md)
- [useRuntime](./runtime/useRuntime.md)
- [useRuntimeMode](./runtime/useRuntimeMode.md)

### Registration

- [initializeFirefly](./registration/initializeFirefly.md)
- [useDeferredRegistrations](./registration/useDeferredRegistrations.md)
- [mergeDeferredRegistrations](./registration/mergeDeferredRegistrations.md)

### Routing

- [AppRouter](./routing/AppRouter.md)
- [PublicRoutes](./routing/publicRoutes.md)
- [ProtectedRoutes](./routing/protectedRoutes.md)
- [useIsBoostrapping](./routing/useIsBootstrapping.md)
- [useRoutes](./routing/useRoutes.md)
- [useRouteMatch](./routing/useRouteMatch.md)
- [useIsRouteProtected](./routing/useIsRouteProtected.md)
- [resolveRouteSegments](./routing/resolveRouteSegments.md)
- [useRenderedNavigationItems](./routing/useRenderedNavigationItems.md)
- [useNavigationItems](./routing/useNavigationItems.md)
- [isNavigationLink](./routing/isNavigationLink.md)

### Messaging

- [useEventBusDispatcher](./messaging/useEventBusDispatcher.md)
- [useEventBusListener](./messaging/useEventBusListener.md)

### Global data fetching

- [usePublicDataQueries](./global-data-fetching/usePublicDataQueries.md)
- [useProtectedDataQueries](./global-data-fetching/useProtectedDataQueries.md)
- [usePublicDataHandler](./global-data-fetching/usePublicDataHandler.md)
- [useProtectedDataHandler](./global-data-fetching/useProtectedDataHandler.md)
- [isGlobalDataQueriesError](./global-data-fetching/isGlobalDataQueriesError.md)

### i18next

- [i18nextPlugin](./i18next/i18nextPlugin.md)
- [getI18nextPlugin](./i18next/getI18nextPlugin.md)
- [useChangeLanguage](./i18next/useChangeLanguage.md)
- [useCurrentLanguage](./i18next/useCurrentLanguage.md)
- [useI18nextInstance](./i18next/useI18nextInstance.md)
- [I18nextNavigationItemLabel](./i18next/I18nextNavigationItemLabel.md)

### Environment variables

- [EnvironmentVariablesPlugin](./env-vars/EnvironmentVariablesPlugin.md)
- [useEnvironmentVariable](./env-vars/useEnvironmentVariable.md)
- [useEnvironmentVariables](./env-vars/useEnvironmentVariables.md)

### Logging

- [useLogger](./logging/useLogger.md)

### Plugins

- [Plugin](./plugins/Plugin.md)
- [usePlugin](./plugins/usePlugin.md)

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

### Module Federation

- [initializeFirefly](./module-federation/initializeFirefly.md)
