import { isNil, isNilOrEmpty } from "@squide/core";

export class LocalStorageManager<T> {
    readonly #key: string;
    #cache?: T = undefined;

    constructor(key: string) {
        this.#key = key;
    }

    setObjectValue(value: T) {
        if (isNil(value)) {
            window.localStorage.removeItem(this.#key);
        } else {
            window.localStorage.setItem(this.#key, JSON.stringify(value));
        }

        this.#cache = undefined;
    }

    getObjectValue() {
        if (!isNil(this.#cache)) {
            return this.#cache;
        }

        const rawValue = window.localStorage.getItem(this.#key);

        if (!isNilOrEmpty(rawValue)) {
            this.#cache = JSON.parse(rawValue);

            return this.#cache;
        }

        return undefined;
    }

    clearStorage() {
        this.#cache = undefined;

        window.localStorage.removeItem(this.#key);
    }
}
