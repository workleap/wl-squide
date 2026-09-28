import type { i18n, ResourceLanguage } from "i18next";

/**
 * Loads the resources of a language for an i18next instance. Resolves to a map of namespace to resource bundle,
 * the same shape as a single language entry of the i18next `resources` option.
 */
export type LoadResourcesFunction<T extends string = string> = (language: T) => Promise<ResourceLanguage>;

export interface RegisterInstanceOptions<T extends string = string> {
    /**
     * When provided, the plugin loads the resources of a language the instance doesn't hold yet, at registration for
     * the current language, then whenever the language changes. The instance must have been initialized with
     * `resources: {}` so that i18next initializes synchronously and creates its store.
     */
    loadResources?: LoadResourcesFunction<T>;
}

export interface i18nextInstanceRegistryEntry<T extends string = string> {
    readonly key: string;
    readonly instance: i18n;
    readonly loadResources?: LoadResourcesFunction<T>;
    // Tracked apart from the instance store because an empty bundle is a loaded bundle, and the store can't tell.
    readonly loadedLanguages: Set<string>;
    readonly failedLanguages: Set<string>;
    readonly pendingLoads: Map<string, Promise<void>>;
}

export class i18nextInstanceRegistry<T extends string = string> {
    readonly #entries: Map<string, i18nextInstanceRegistryEntry<T>> = new Map();

    add(key: string, instance: i18n, { loadResources }: RegisterInstanceOptions<T> = {}) {
        if (this.#entries.has(key)) {
            throw new Error(`[squide] An i18next instance has already been registered with the "${key}" key.`);
        }

        const entry: i18nextInstanceRegistryEntry<T> = {
            key,
            instance,
            loadResources,
            loadedLanguages: new Set(),
            failedLanguages: new Set(),
            pendingLoads: new Map()
        };

        this.#entries.set(key, entry);

        return entry;
    }

    getInstance(key: string) {
        return this.#entries.get(key)?.instance;
    }

    getInstances() {
        return Array.from(this.#entries.values(), x => x.instance);
    }

    getEntries() {
        return Array.from(this.#entries.values());
    }
}
