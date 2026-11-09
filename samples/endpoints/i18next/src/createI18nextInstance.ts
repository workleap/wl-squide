import type { LanguageKey } from "@endpoints/shared";
import type { InitOptions } from "i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export function createI18nextInstance(language: LanguageKey, options: InitOptions = {}) {
    const instance = i18n.createInstance().use(initReactI18next);

    instance.init({
        lng: language,
        ...options
    });

    return instance;
}
