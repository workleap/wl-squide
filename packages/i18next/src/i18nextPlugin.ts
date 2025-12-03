import { match } from "@formatjs/intl-localematcher";
import { Plugin, isNil, type Runtime } from "@squide/core";
import type { i18n } from "i18next";
import LanguageDetector, { type DetectorOptions } from "i18next-browser-languagedetector";
import { i18nextInstanceRegistry } from "./i18nextInstanceRegistry.ts";

export const i18nextPluginName = "i18-next-plugin";

export interface i18nextPluginOptions {
    detection?: Omit<DetectorOptions, "lookupQuerystring">;
}

export function findSupportedPreferredLanguage<T extends string>(userPreferredLanguages: string[], supportedLanguages: T[]) {
    // We don't want a fallback language here but it's a required parameter, therefore
    // we provide a dummy value to return "undefined".
    let result: string | undefined = match(userPreferredLanguages, supportedLanguages, "__dummy_fallback__", {
        algorithm: "lookup"
    });

    if (result === "__dummy_fallback__") {
        result = undefined;
    }

    if (isNil(result)) {
        // Intl.LocaleMatcher "lookup" algorithm returns null when a prefered language is "fr" and a supported language is "fr-CA".
        // We would prefer if it returns "fr", that's what this code is for.
        result = supportedLanguages.find(x => {
            return userPreferredLanguages.some(y => x.startsWith(`${y}-`));
        });
    }

    return result;
}

export class i18nextPlugin<T extends string = string> extends Plugin {
    #currentLanguage?: T;

    readonly #supportedLanguages: T[];
    readonly #fallbackLanguage: T;
    readonly #languageDetector: LanguageDetector;
    readonly #registry = new i18nextInstanceRegistry();

    constructor(supportedLanguages: T[], fallbackLanguage: T, queryStringKey: string, { detection }: i18nextPluginOptions = {}, runtime: Runtime) {
        super(i18nextPluginName, runtime);

        this.#supportedLanguages = supportedLanguages;
        this.#fallbackLanguage = fallbackLanguage;

        this.#languageDetector = new LanguageDetector(null, {
            order: ["querystring", "navigator"],
            lookupQuerystring: queryStringKey,
            ...(detection ?? {})
        });
    }

    registerInstance(key: string, instance: i18n) {
        this.#registry.add(key, instance);

        this._runtime.logger
            .withText(`[squide] Registered a new i18next instance with key "${key}":`)
            .withObject(instance)
            .debug();
    }

    getInstance(key: string) {
        const instance = this.#registry.getInstance(key);

        if (isNil(instance)) {
            throw new Error(`[squide] Cannot find a registered i18next instance for key: ${key}. Did you forget to register the i18next instance with the i18nextPlugin?`);
        }

        return instance;
    }

    detectUserLanguage() {
        // Could either be detected from a querystring parameter or the user navigator language preferences.
        let detectedLanguage = this.#languageDetector.detect();

        if (detectedLanguage) {
            // The navigator language preferences could be something like ["en-US", "en", "fr-CA", "fr"].
            if (Array.isArray(detectedLanguage)) {
                this._runtime.logger.information(`[squide] Detected ${detectedLanguage.map(x => `"${x}"`).join(",")} as user language${detectedLanguage.length >= 1 ? "s" : ""}.`);

                // Ensure the navigator language preferences includes at least one supported language.
                detectedLanguage = findSupportedPreferredLanguage(detectedLanguage, this.#supportedLanguages);
            } else {
                this._runtime.logger.information(`[squide] Detected "${detectedLanguage}" as user language.`);

                // Ensure the navigator language preferences includes at least one supported language.
                detectedLanguage = findSupportedPreferredLanguage([detectedLanguage], this.#supportedLanguages);
            }
        }

        if (isNil(detectedLanguage)) {
            detectedLanguage = this.#fallbackLanguage;
        }

        this.#currentLanguage = detectedLanguage as T;

        this._runtime.logger.information(`[squide] The language has been set to "${this.#currentLanguage}".`);
    }

    get currentLanguage() {
        if (isNil(this.#currentLanguage)) {
            throw new Error("[squide] The currentLanguage getter is called but no user language has been detected yet. Did you forget to call the detectUserLanguage function?");
        }

        return this.#currentLanguage;
    }

    changeLanguage(language: T) {
        if (language !== this.#currentLanguage) {
            if (!this.#supportedLanguages.includes(language)) {
                throw new Error(`[squide] Cannot change language for "${language}" because it's not part of the supported languages array. Supported languages are ${this.#supportedLanguages.map(x => `"${x}"`).join(",")}.`);
            }

            this.#registry.getInstances().forEach(x => {
                x.changeLanguage(language);
            });

            this.#currentLanguage = language;

            this._runtime.logger.information(`[squide] The language has been changed to "${this.#currentLanguage}".`);
        }
    }
}

export function getI18nextPlugin(runtime: Runtime) {
    return runtime.getPlugin(i18nextPluginName) as i18nextPlugin;
}
