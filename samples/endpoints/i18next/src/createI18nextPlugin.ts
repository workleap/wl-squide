import type { LanguageKey } from "@endpoints/shared";
import type { Runtime } from "@squide/firefly";
import { i18nextPlugin, type i18nextPluginOptions } from "@squide/i18next";

export function createI18NextPlugin(runtime: Runtime, options?: i18nextPluginOptions) {
    const plugin = new i18nextPlugin<LanguageKey>(runtime, ["en-US", "fr-CA"], "en-US", "language", options);

    // By default, detect user default language for anonymous pages.
    // If the user is authenticated, the language will be changed for the persisted user
    // preferred language once the session is loaded.
    plugin.detectUserLanguage();

    return plugin;
}
