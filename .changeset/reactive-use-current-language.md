---
"@squide/i18next": minor
---

The `useCurrentLanguage` hook is now reactive: components re-render when the language is changed with `useChangeLanguage` or the plugin's `changeLanguage` method. Previously the hook was a one-time read, so consumers that don't render through `useTranslation` (e.g. React Aria's `I18nProvider`, `document.documentElement.lang`) went stale after a runtime language switch.

The `i18nextPlugin` class also exposes new `registerLanguageChangedListener` and `removeLanguageChangedListener` methods.
