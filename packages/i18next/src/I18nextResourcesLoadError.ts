export class I18nextResourcesLoadError extends Error {
    readonly #key: string;
    readonly #language: string;

    constructor(key: string, language: string, options?: ErrorOptions) {
        super(`[squide] An error occurred while loading the "${language}" resources of the i18next instance with key "${key}".`, options);

        this.name = "I18nextResourcesLoadError";
        this.#key = key;
        this.#language = language;
    }

    /**
     * The key of the i18next instance whose resources failed to load.
     */
    get key() {
        return this.#key;
    }

    /**
     * The language whose resources failed to load.
     */
    get language() {
        return this.#language;
    }
}

export function isI18nextResourcesLoadError(error?: unknown): error is I18nextResourcesLoadError {
    return error !== undefined && error !== null && error instanceof I18nextResourcesLoadError;
}
