# ADR-0010: i18n Via Centralized Instance Registry

## Status

accepted

## Context

In a modular application, each module may have its own translation resources, namespaces, and i18next configuration. Language changes must be synchronized across all modules for a consistent UI — if one module switches to French, all modules must switch simultaneously. Additionally, the framework needs to handle language detection (from browser settings, URL parameters, or stored preferences) and provide React-friendly hooks for language state.

## Options Considered

1. **Single shared i18next instance** — Simpler but creates coupling between module namespaces and resource bundles. Adding a module means modifying the shared instance's configuration.
2. **Fully independent instances** — Each module manages its own language. No synchronization, inconsistent UI during language transitions.
3. **Centralized instance registry** — Each module creates its own i18next instance and registers it. Language changes are broadcast to all registered instances.

## Decision

Option 3. The `i18nextPlugin` maintains an `i18nextInstanceRegistry` (entries keyed by module name, each holding the `i18n` instance, an optional `loadResources` function and the per-language load state). When `changeLanguage()` is called, it first loads the requested language into every instance that doesn't hold it, then iterates through all registered instances and calls `changeLanguage` on each, ensuring atomic language transitions across all modules. `changeLanguage` returns a promise; it stays synchronous when nothing needs loading, follows a latest-call-wins policy under concurrency, and rejects with an `I18nextResourcesLoadError` (leaving the language unchanged) when a load fails.

**Lazy loading is a registration option, not a new registry.** `registerInstance(key, instance, { loadResources })` is the only surface: the plugin owns when a language is loaded (the current one at registration, the target one before a switch), how bundles are added (`addResourceBundle(lng, ns, bundle, true, true, { skipCopy: true })` then re-applying the language so mounted `react-i18next` consumers re-render), and how failures are reported (runtime logger, `squide-i18next-resources-load-failed` event, typed rejection). No i18next backend plugin is involved, so `react-i18next` never suspends and the runtime semantics are those of static resources. `registerInstance` throws once the modules are registered, mirroring `registerRoute`: an instance registered from a deferred registration function would miss the initial load and the readiness evaluation.

**The plugin owns readiness.** It implements the generic readiness surface of `Plugin` (ADR-0009): it becomes ready once the modules are registered and every entry has settled the load of the current language, either by holding it or by failing it (fail-open: the application renders the key or the `fallbackLng` value rather than staying on its spinner). Readiness is evaluated only after Phase 1 registration, otherwise an empty registry would latch before any module registers a lazy instance. An in-flight `changeLanguage` never affects the latch; callers await the returned promise instead. The host applies the session's preferred language by awaiting `changeLanguage` in a deferred registration, which completes before `modules-ready`.

Unlike `EnvironmentVariablesPlugin` (ADR-0008), the `i18nextPlugin` is not automatically created — it must be explicitly provided as a plugin factory (ADR-0004) in the `initializeFirefly` call. This is because i18n is not universally needed, and the plugin requires consumer configuration (supported languages, detection strategy, fallback language).

Language detection uses `i18next-browser-languagedetector` and `@formatjs/intl-localematcher` to negotiate between the browser's preferred languages and the application's supported languages. The detected language is stored and applied to all registered instances on startup.

The package provides React hooks for common operations: `useChangeLanguage()` returns a callback that triggers the synchronized language change across all instances, `useCurrentLanguage()` returns the active language reactively, and `useI18nextInstance()` retrieves a module's registered instance for use with `react-i18next`'s `I18nextProvider`. For navigation items that need to display translated labels, the `I18nextNavigationItemLabel` component subscribes to language changes and re-renders the label when the language switches — this is necessary because navigation items are registered once during the registration phase (ADR-0001), not during React rendering.

Evidence: `packages/i18next/src/i18nextPlugin.ts` (`changeLanguage` loads then iterates the registered instances; `registerInstance` starts the initial load and throws once modules are registered; `#evaluateReadiness` latches once every entry is settled). `packages/i18next/src/i18nextInstanceRegistry.ts` stores the entries (`instance`, `loadResources`, `loadedLanguages`, `failedLanguages`, `pendingLoads`). `packages/i18next/src/I18nextResourcesLoadError.ts` is the typed rejection. `packages/i18next/src/useChangeLanguage.ts`, `packages/i18next/src/useCurrentLanguage.ts`, and `packages/i18next/src/useI18nextInstance.ts` provide the React hooks. `packages/i18next/src/I18nextNavigationItemLabel.tsx` handles reactive navigation label translation. `packages/i18next/tests/i18nextPlugin.test.ts` covers loading, concurrency, readiness and failure reporting. `samples/endpoints/**/i18next.ts` register lazy instances with one dynamic JSON import per language.

## Consequences

- Module autonomy preserved — each module owns its namespace, resources, and configuration, and declares its own per-language loader (typically one dynamic import per language). Bundler chunking stays with the module.
- Language changes are consistent and atomic across all modules, including the resources load that precedes a switch.
- The `I18nextNavigationItemLabel` component bridges the gap between registration-time navigation items and runtime language changes.
- Modules must register their instance with the plugin during their `register()` function, and the plugin now enforces it (a later registration throws).
- The plugin is opt-in — applications without i18n support pay no cost. Applications with static instances only see no load and no new event beyond `squide-plugins-ready`.
- `changeLanguage` is async: callers await it, effects need a block body, and Storybook stories await it from a `loaders` entry rather than a decorator effect.
- A failed load is fail-open: the application renders, the failure is reported, and the affected instance shows the key or the `fallbackLng` value. Turning that into an error page, retrying, or falling back to the plugin's fallback language is left to the host.
