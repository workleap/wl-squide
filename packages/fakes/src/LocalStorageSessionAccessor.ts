import { LocalStorageAccessor } from "./LocalStorageAccessor.ts";
import { SessionLocalStorageKey } from "./sessionKey.ts";

export interface LocalStorageSessionAccessorOptions {
    key?: string;
}

export class LocalStorageSessionAccessor<T = unknown> {
    readonly #localStorageAccessor: LocalStorageAccessor<T>;

    constructor({ key = SessionLocalStorageKey }: LocalStorageSessionAccessorOptions = {}) {
        this.#localStorageAccessor = new LocalStorageAccessor(key);
    }

    getSession() {
        return this.#localStorageAccessor.getObjectValue();
    }
}
