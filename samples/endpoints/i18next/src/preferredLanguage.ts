import type { LanguageKey } from "@endpoints/shared";

// The language detected at bootstrapping is the one loaded when the lazy i18next instances are registered, before the
// session is available. Persisting the user preferred language lets the detection pick it up on the next visit, which
// avoids downloading the navigator language first and the preferred language afterwards.
export const PreferredLanguageStorageKey = "squide-endpoints-preferred-language";

export function persistPreferredLanguage(language: LanguageKey) {
    localStorage.setItem(PreferredLanguageStorageKey, language);
}

export function clearPreferredLanguage() {
    localStorage.removeItem(PreferredLanguageStorageKey);
}
