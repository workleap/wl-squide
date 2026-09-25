---
"@squide/i18next": major
---

Resources can now be lazy-loaded per language, and the plugin reports its readiness to the bootstrapping flow.

**New**

- `registerInstance(key, instance, options?)` accepts a `loadResources` function (`(language) => Promise<ResourceLanguage>`, a namespace to bundle map). When provided, the plugin loads the resources of the current language right away, and the resources of any language the instance doesn't hold before switching to it. The instance must be initialized with `resources: {}` (or `initAsync: false`) so that i18next initializes synchronously, otherwise the components rendering it could suspend while the resources load; `registerInstance` throws when it isn't. A hybrid instance holding the static resources of one language and lazy-loading the others is supported. Exported types: `LoadResourcesFunction`, `RegisterInstanceOptions`, `i18nextInstanceRegistryEntry`.
- The plugin implements the `Plugin` readiness surface (`isReady()`, `registerReadyListener()`, `removeReadyListener()`). It becomes ready once the modules are registered and every registered instance has settled the load of the current language, which keeps `useIsBootstrapping` `true` until the initial resources are loaded. A failed load counts as settled, so the application still renders.
- Every failed load is logged, dispatched on the event bus as `I18nextResourcesLoadFailedEvent` (`"squide-i18next-resources-load-failed"`, payload `{ key, language, error }`) and, when triggered by `changeLanguage`, rejected as an `I18nextResourcesLoadError` exposing `key`, `language` and `cause`. Use `isI18nextResourcesLoadError(error)` to identify it. A failed load isn't cached, a later call invokes the loader again.
- `i18nextInstanceRegistry.getEntries()` returns the registered entries with their load state.

**Breaking**

- `changeLanguage(language)` now returns a `Promise<void>`. Await it. It resolves once the resources of the language are loaded into every lazy instance and the switch is done. When nothing needs loading, the switch still happens synchronously. Latest call wins: a call superseded by a more recent one resolves without switching. Called with the current language, it waits for the pending loads of that language and resolves without notifying the listeners.
- An unsupported language now rejects the returned promise instead of throwing synchronously, and a failed resources load rejects with an `I18nextResourcesLoadError` while leaving the language unchanged.
- `useChangeLanguage()` returns `(language) => Promise<void>`. A React effect written as a concise arrow function now returns the promise to React, which is not allowed: use a block body, `useEffect(() => { changeLanguage(language); }, [language]);`.
- `registerInstance` throws once the modules are registered. Instances must be registered from a module's register function, never from a deferred registration function.

**Migration**

- Search for `changeLanguage(` and `useChangeLanguage()` usages and await the promise, or wrap the call in a block body when used in an effect or an event handler.
- To apply a session's preferred language, await `changeLanguage` from a deferred registration function rather than from a React effect. Squide awaits deferred registrations before the modules become ready, so the switch completes before the first protected page renders, and a rejection reaches the `onError` callback of `useDeferredRegistrations` as the `cause` of a `ModuleRegistrationError`.
- Storybook: a decorator calling `changeLanguage` from an effect is now racy for snapshots. Await `getI18nextPlugin(runtime).changeLanguage(language)` from a Storybook `loaders` entry instead. Called with the current language, it waits for the initial resources to load. Instances must be registered from the `localModules` passed to `initializeFireflyForStorybook`: it marks the modules as registered before it returns, so an instance registered afterwards (for example from `preview.tsx`) now throws. Call `detectUserLanguage()` in the plugin factory, a lazy instance requires a detected language.
- Requires `@squide/core` 7.6.0 or later and `@squide/firefly` 19.3.0 or later for `useIsBootstrapping` to wait for the resources.
