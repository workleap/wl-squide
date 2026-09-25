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

Option 3. The `i18nextPlugin` maintains an `i18nextInstanceRegistry` (entries keyed by module name, each holding the `i18n` instance and, optionally, a `loadResources` function with its per-language load state). When `changeLanguage()` is called, it loads the requested language into every instance that doesn't hold it, then iterates through all registered instances and calls `changeLanguage` on each, ensuring atomic language transitions across all modules.

Lazy loading is an option of `registerInstance(key, instance, { loadResources })` rather than a separate registry or an i18next backend plugin: the plugin owns when a language is loaded and how its bundles are added, and `react-i18next` never suspends. The plugin also owns readiness through the generic surface of `Plugin` (ADR-0009): it is ready once the modules are registered, every instance has settled the load of the current language, a failed load included (fail-open), and no `changeLanguage` call is still loading resources. Because firefly consults the plugins once the other inputs are ready, the host keeps switching to the session's preferred language from a `BootstrappingRoute` effect, static and lazy resources alike; the plugin reports not ready while that switch downloads. `registerInstance` throws once the modules are registered, mirroring `registerRoute`.

Unlike `EnvironmentVariablesPlugin` (ADR-0008), the `i18nextPlugin` is not automatically created — it must be explicitly provided as a plugin factory (ADR-0004) in the `initializeFirefly` call. This is because i18n is not universally needed, and the plugin requires consumer configuration (supported languages, detection strategy, fallback language).

Language detection uses `i18next-browser-languagedetector` and `@formatjs/intl-localematcher` to negotiate between the browser's preferred languages and the application's supported languages. The detected language is stored and applied to all registered instances on startup.

The package provides React hooks for common operations: `useChangeLanguage()` returns a callback that triggers the synchronized language change across all instances, `useCurrentLanguage()` returns the active language reactively, and `useI18nextInstance()` retrieves a module's registered instance for use with `react-i18next`'s `I18nextProvider`. For navigation items that need to display translated labels, the `I18nextNavigationItemLabel` component subscribes to language changes and re-renders the label when the language switches — this is necessary because navigation items are registered once during the registration phase (ADR-0001), not during React rendering.

Evidence: `packages/i18next/src/i18nextPlugin.ts` (`changeLanguage` loads then iterates the registered instances, `registerInstance` starts the initial load, `#evaluateReadiness` latches once every entry is settled). `packages/i18next/src/i18nextInstanceRegistry.ts` stores the entries. `packages/i18next/src/useChangeLanguage.ts`, `packages/i18next/src/useCurrentLanguage.ts`, and `packages/i18next/src/useI18nextInstance.ts` provide the React hooks. `packages/i18next/src/I18nextNavigationItemLabel.tsx` handles reactive navigation label translation.

## Consequences

- Module autonomy preserved — each module owns its namespace, resources, and configuration, including its per-language loader.
- Language changes are consistent and atomic across all modules.
- The `I18nextNavigationItemLabel` component bridges the gap between registration-time navigation items and runtime language changes.
- Modules must register their instance with the plugin during their `register()` function, which the plugin enforces.
- The plugin is opt-in — applications without i18n support pay no cost.
- A failed resources load is fail-open: the application renders and the failure is reported through the logger, the event bus and the `changeLanguage` rejection. An error page, a retry or a fallback language is left to the host.
- The initial load targets the language detected at bootstrapping, because modules register before any global data. A session's preferred language, when different, costs a second download once the session is fetched. The documented mitigation is host-side: persist the preferred language and detect it through the `localStorage` detection source.
