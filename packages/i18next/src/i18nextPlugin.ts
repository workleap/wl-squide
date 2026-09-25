import { match } from "@formatjs/intl-localematcher";
import { Plugin, type PluginReadyListener, type Runtime } from "@squide/core";
import { isNil } from "@squide/core/internal";
import type { i18n } from "i18next";
import LanguageDetector, { type DetectorOptions } from "i18next-browser-languagedetector";
import { i18nextInstanceRegistry, type i18nextInstanceRegistryEntry, type RegisterInstanceOptions } from "./i18nextInstanceRegistry.ts";
import { I18nextResourcesLoadError } from "./I18nextResourcesLoadError.ts";

export const i18nextPluginName = "i18-next-plugin";

export const I18nextResourcesLoadFailedEvent = "squide-i18next-resources-load-failed";

export interface I18nextResourcesLoadFailedEventPayload {
    key: string;
    language: string;
    error: unknown;
}

declare module "@squide/core" {
    interface EventMap {
        "squide-i18next-resources-load-failed": I18nextResourcesLoadFailedEventPayload;
    }
}

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

export type LanguageChangedListener = () => void;

interface ResourceStoreWithLanguageCheck {
    hasLanguageSomeTranslations(language: string): boolean;
}

// The method exists on the i18next resource store but isn't part of its typings.
function hasLanguageSomeTranslations(instance: i18n, language: string) {
    return (instance.store as unknown as ResourceStoreWithLanguageCheck).hasLanguageSomeTranslations(language);
}

export class i18nextPlugin<T extends string = string> extends Plugin {
    #currentLanguage?: T;
    #isReady = false;
    #changeLanguageToken = 0;
    // Whether the latest "changeLanguage" call is still loading resources.
    #isSwitchPending = false;

    readonly #supportedLanguages: T[];
    readonly #fallbackLanguage: T;
    readonly #languageDetector: LanguageDetector;
    readonly #registry = new i18nextInstanceRegistry<T>();
    readonly #languageChangedListeners = new Set<LanguageChangedListener>();
    readonly #readyListeners = new Set<PluginReadyListener>();

    constructor(runtime: Runtime, supportedLanguages: T[], fallbackLanguage: T, queryStringKey: string, { detection }: i18nextPluginOptions = {}) {
        super(i18nextPluginName, runtime);

        this.#supportedLanguages = supportedLanguages;
        this.#fallbackLanguage = fallbackLanguage;

        this.#languageDetector = new LanguageDetector(null, {
            order: ["querystring", "navigator"],
            lookupQuerystring: queryStringKey,
            ...(detection ?? {})
        });

        // Readiness is only reported once the modules are registered, otherwise an empty registry would report the
        // plugin as ready before any module registers an instance with resources to load.
        this._runtime.moduleManager.registerModulesRegisteredListener(() => {
            this.#evaluateReadiness();
        });
    }

    /**
     * Registers an i18next instance. Must be executed from a module's register function: once the modules are
     * registered, the call throws.
     *
     * When a `loadResources` function is provided, the instance must have been initialized (with `resources: {}` when
     * it holds no static resources) and the user language must have been detected. The plugin then loads the
     * resources of the current language right away, and the resources of any language the instance doesn't hold
     * when the language changes.
     */
    registerInstance(key: string, instance: i18n, { loadResources }: RegisterInstanceOptions<T> = {}) {
        if (this._runtime.moduleManager.getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register an i18next instance once the modules are registered. Are you trying to register an instance in a deferred registration function? Instances must be registered in a module's register function.");
        }

        if (loadResources) {
            if (isNil(this.#currentLanguage)) {
                throw new Error(`[squide] Cannot register the i18next instance with key "${key}" with a "loadResources" function because no user language has been detected yet. Did you forget to call the detectUserLanguage function?`);
            }

            // The store and the "addResourceBundle" function are created by "init".
            if (isNil(instance.store)) {
                throw new Error(`[squide] Cannot register the i18next instance with key "${key}" with a "loadResources" function because the instance hasn't been initialized. Did you forget to call the "init" function of the instance?`);
            }

            // Without a "resources" option, i18next defers its initialization to a timer. Until it fires, the instance
            // isn't initialized and react-i18next suspends the components rendering it.
            if (isNil(instance.options.resources) && instance.options.initAsync !== false) {
                throw new Error(`[squide] Cannot register the i18next instance with key "${key}" with a "loadResources" function because the instance has been initialized without a "resources" option. Initialize the instance with "resources: {}" so that i18next initializes synchronously, otherwise the components could suspend while the resources are loading.`);
            }
        }

        const entry = this.#registry.add(key, instance, { loadResources });

        this._runtime.logger
            .withText(`[squide] Registered a new i18next instance with key "${key}":`)
            .withObject(instance)
            .debug();

        if (!isNil(this.#currentLanguage) && !this.#holdsLanguage(entry, this.#currentLanguage)) {
            // The failure is reported by the load itself, and a failed load settles the readiness latch.
            this.#ensureLanguage(entry, this.#currentLanguage).catch(() => {
                // Nothing left to do, see above.
            });
        }

        this.#evaluateReadiness();
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

    /**
     * Changes the current language of every registered instance, after loading the resources of that language into
     * the instances that don't hold them yet.
     *
     * The returned promise resolves once the switch is done. It rejects with an {@link I18nextResourcesLoadError}
     * when a load fails, in which case the language is left unchanged. When the call is superseded by a more recent
     * call, it resolves without switching. Called with the current language, it waits for the pending loads of that
     * language without notifying the listeners. Throws synchronously when the language isn't supported.
     */
    changeLanguage(language: T): Promise<void> {
        if (!this.#supportedLanguages.includes(language)) {
            throw new Error(`[squide] Cannot change language for "${language}" because it's not part of the supported languages array. Supported languages are ${this.#supportedLanguages.map(x => `"${x}"`).join(",")}.`);
        }

        return this.#changeLanguage(language);
    }

    async #changeLanguage(language: T) {
        // Latest call wins.
        const token = ++this.#changeLanguageToken;

        const pendingLoads = this.#registry.getEntries()
            .filter(x => !this.#holdsLanguage(x, language))
            .map(x => this.#ensureLanguage(x, language));

        // The readiness status reports the latest requested switch: the plugin isn't ready while its resources load.
        this.#isSwitchPending = pendingLoads.length > 0;

        // Only awaiting when a load is needed keeps a switch between static instances synchronous.
        if (pendingLoads.length > 0) {
            this.#evaluateReadiness();

            try {
                await Promise.all(pendingLoads);
            } catch (error: unknown) {
                if (token !== this.#changeLanguageToken) {
                    return;
                }

                // The language is left unchanged and its resources are settled, the application can render.
                this.#isSwitchPending = false;
                this.#evaluateReadiness();

                throw error;
            }

            if (token !== this.#changeLanguageToken) {
                return;
            }

            this.#isSwitchPending = false;
        }

        if (language !== this.#currentLanguage) {
            this.#registry.getInstances().forEach(x => {
                x.changeLanguage(language);
            });

            this.#currentLanguage = language;

            this._runtime.logger.information(`[squide] The language has been changed to "${this.#currentLanguage}".`);

            this.#languageChangedListeners.forEach(x => {
                x();
            });
        }

        this.#evaluateReadiness();
    }

    registerLanguageChangedListener(callback: LanguageChangedListener) {
        this.#languageChangedListeners.add(callback);
    }

    removeLanguageChangedListener(callback: LanguageChangedListener) {
        this.#languageChangedListeners.delete(callback);
    }

    /**
     * Whether the modules are registered, every registered instance has settled the load of the current language
     * resources and no language switch requested with {@link changeLanguage} is still loading. A failed load counts
     * as settled so the application still renders. The application consults it once every other bootstrapping input
     * is ready, therefore a switch to the user preferred language requested from the bootstrapping route holds the
     * render until its resources are loaded.
     */
    isReady() {
        return this.#isReady;
    }

    registerReadyListener(callback: PluginReadyListener) {
        this.#readyListeners.add(callback);
    }

    removeReadyListener(callback: PluginReadyListener) {
        this.#readyListeners.delete(callback);
    }

    #holdsLanguage(entry: i18nextInstanceRegistryEntry<T>, language: T) {
        // A static instance holds every language it will ever hold.
        if (!entry.loadResources) {
            return true;
        }

        return entry.loadedLanguages.has(language) || hasLanguageSomeTranslations(entry.instance, language);
    }

    #ensureLanguage(entry: i18nextInstanceRegistryEntry<T>, language: T) {
        const pendingLoad = entry.pendingLoads.get(language);

        if (pendingLoad) {
            return pendingLoad;
        }

        // A settled load is removed so that a call following a failure re-invokes the loader.
        const promise = this.#loadLanguage(entry, language).finally(() => {
            entry.pendingLoads.delete(language);
        });

        entry.pendingLoads.set(language, promise);

        return promise;
    }

    async #loadLanguage(entry: i18nextInstanceRegistryEntry<T>, language: T) {
        const { key, instance, loadResources } = entry;

        try {
            // Only called for entries with a loader.
            const bundles = await loadResources!(language);

            Object.entries(bundles).forEach(([namespace, bundle]) => {
                instance.addResourceBundle(language, namespace, bundle, true, true, { skipCopy: true });
            });

            entry.loadedLanguages.add(language);
            entry.failedLanguages.delete(language);

            // react-i18next re-renders on "languageChanged" and not on "added", therefore the bundles are invisible to
            // the mounted components until the language is applied again. It also repopulates "resolvedLanguage".
            if (instance.language === language) {
                instance.changeLanguage(language);
            }

            this._runtime.logger.debug(`[squide] Loaded the "${language}" resources of the i18next instance with key "${key}".`);
        } catch (error: unknown) {
            entry.failedLanguages.add(language);

            this._runtime.logger
                .withText(`[squide] An error occurred while loading the "${language}" resources of the i18next instance with key "${key}":`)
                .withError(error as Error)
                .error();

            this._runtime.eventBus.dispatch(I18nextResourcesLoadFailedEvent, {
                key,
                language,
                error
            } satisfies I18nextResourcesLoadFailedEventPayload);

            throw new I18nextResourcesLoadError(key, language, { cause: error });
        } finally {
            // A failed load is settled too.
            this.#evaluateReadiness();
        }
    }

    #computeReadiness() {
        if (!this._runtime.moduleManager.getAreModulesRegistered()) {
            return false;
        }

        if (this.#isSwitchPending) {
            return false;
        }

        // Reading the field rather than the getter: this executes from the module registries status listeners, which
        // must not throw when no language has been detected.
        const language = this.#currentLanguage;

        // A loader can only be registered once a language has been detected, therefore without a language every entry is static.
        return isNil(language) || this.#registry.getEntries().every(x => {
            return this.#holdsLanguage(x, language) || x.failedLanguages.has(language);
        });
    }

    #evaluateReadiness() {
        const wasReady = this.#isReady;

        this.#isReady = this.#computeReadiness();

        // The listeners are only notified of a transition to ready, a consumer reads "isReady" for the current status.
        if (this.#isReady && !wasReady) {
            this._runtime.logger.debug("[squide] The i18next plugin is ready.");

            // Copying the listeners in case one is removed while notifying.
            new Set(this.#readyListeners).forEach(x => {
                x();
            });
        }
    }
}

export function getI18nextPlugin(runtime: Runtime) {
    const plugin = runtime.getPlugin(i18nextPluginName, {
        throwOnNotFound: false
    }) as i18nextPlugin;

    if (!plugin) {
        throw new Error("[squide] The getI18nextPlugin function is called but no i18nextPlugin instance has been registered with the runtime. Did you provide a i18nextPlugin instance to the runtime instance or the initializeFirefly function?");
    }

    return plugin;
}
