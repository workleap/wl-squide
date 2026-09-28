import type { LanguageKey } from "@endpoints/shared";
import type { Runtime } from "@squide/firefly";
import { i18nextPlugin, type i18nextPluginOptions } from "@squide/i18next";
import { PreferredLanguageStorageKey } from "./preferredLanguage.ts";

export function createI18NextPlugin(runtime: Runtime, { detection, ...options }: i18nextPluginOptions = {}) {
    const plugin = new i18nextPlugin<LanguageKey>(runtime, ["en-US", "fr-CA"], "en-US", "language", {
        detection: {
            // The querystring still wins, then the preferred language persisted by a previous session, then the
            // navigator language. Without the persisted language, an authenticated user whose navigator language
            // differs from the preferred language downloads the resources of both languages.
            order: ["querystring", "localStorage", "navigator"],
            lookupLocalStorage: PreferredLanguageStorageKey,
            ...detection
        },
        ...options
    });

    // By default, detect user default language for anonymous pages.
    // If the user is authenticated, the language will be changed for the persisted user
    // preferred language once the session is loaded.
    plugin.detectUserLanguage();

    return plugin;
}
