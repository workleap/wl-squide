import { isNilOrEmpty } from "@squide/core";

export class LocalStorageAccessor<T = unknown> {
    readonly #key: string;

    constructor(key: string) {
        this.#key = key;
    }

    getObjectValue() {
        const rawValue = window.localStorage.getItem(this.#key);

        if (!isNilOrEmpty(rawValue)) {
            return JSON.parse(rawValue) as T;
        }

        return undefined;
    }
}
