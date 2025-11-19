import { LocalStorageManager } from "./localStorageManager2.ts";
import { SessionLocalStorageKey } from "./sessionKey.ts";

export interface LocalStorageSessionManagerOptions {
    key?: string;
}

export class LocalStorageSessionManager<T = unknown> {
    readonly #localStorageManager: LocalStorageManager<T>;

    constructor({ key = SessionLocalStorageKey }: LocalStorageSessionManagerOptions = {}) {
        this.#localStorageManager = new LocalStorageManager(key);
    }

    setSession(session: T) {
        this.#localStorageManager.setObjectValue(session);
    }

    getSession() {
        return this.#localStorageManager.getObjectValue();
    }

    clearSession() {
        this.#localStorageManager.clearStorage();
    }
}
