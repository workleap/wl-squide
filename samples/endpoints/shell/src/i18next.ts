import { createI18nextInstance as createInstance } from "@endpoints/i18next";
import type { LanguageKey } from "@endpoints/shared";
import type { FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin, type i18nextPlugin, type LoadResourcesFunction } from "@squide/i18next";

export const i18NextInstanceKey = "shell";

// One chunk per language, only the active language is downloaded.
const loadResources: LoadResourcesFunction<LanguageKey> = async language => {
    const loaders = {
        "en-US": () => import("./locales/en-US/resources.json", { with: { type: "json" } }),
        "fr-CA": () => import("./locales/fr-CA/resources.json", { with: { type: "json" } })
    };

    return (await loaders[language]()).default;
};

export function initI18next(runtime: FireflyRuntime) {
    const i18nextPlugin = getI18nextPlugin(runtime) as i18nextPlugin<LanguageKey>;

    // A lazy instance is initialized without resources, the plugin loads the resources of the current language.
    const instance = createInstance(i18nextPlugin.currentLanguage, {
        resources: {}
    });

    i18nextPlugin.registerInstance(i18NextInstanceKey, instance, {
        loadResources
    });

    return instance;
}
