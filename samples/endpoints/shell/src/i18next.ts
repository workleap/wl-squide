import { createI18nextInstance as createInstance } from "@endpoints/i18next";
import type { LanguageKey } from "@endpoints/shared";
import type { FireflyRuntime } from "@squide/firefly";
import { getI18nextPlugin, type i18nextPlugin } from "@squide/i18next";
import resourcesEn from "./locales/en-US/resources.json" with { type: "json" };
import resourcesFr from "./locales/fr-CA/resources.json" with { type: "json" };

export const i18NextInstanceKey = "shell";

export function initI18next(runtime: FireflyRuntime) {
    const i18nextPlugin = getI18nextPlugin(runtime) as i18nextPlugin<LanguageKey>;

    const instance = createInstance(i18nextPlugin.currentLanguage, {
        resources: {
            "en-US": resourcesEn,
            "fr-CA": resourcesFr
        }
    });

    i18nextPlugin.registerInstance(i18NextInstanceKey, instance);

    return instance;
}
