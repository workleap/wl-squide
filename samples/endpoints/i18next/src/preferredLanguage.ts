import type { LanguageKey } from "@endpoints/shared";

// The language detected at bootstrapping is the one loaded when the lazy i18next instances are registered, before the
// session is available. Persisting the user preferred language lets the detection pick it up on the next visit, which
// avoids downloading the navigator language first and the preferred language afterwards. The value is deliberately kept
// after a logout: the next session on this browser is most likely the same user, and the login page renders in their language.
export const PreferredLanguageStorageKey = "squide-endpoints-preferred-language";

export function persistPreferredLanguage(language: LanguageKey) {
    localStorage.setItem(PreferredLanguageStorageKey, language);
}
