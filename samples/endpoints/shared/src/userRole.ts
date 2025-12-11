import { LocalStorageAccessor, LocalStorageManager } from "@squide/fakes";

export type UserRole = "user" | "admin";

const LocalStorageKey = "app-user-role";
const DefaultRole: UserRole = "user";

export class LocalStorageUserRoleManager {
    readonly #localStorageManager: LocalStorageManager<UserRole>;

    constructor() {
        this.#localStorageManager = new LocalStorageManager(LocalStorageKey);
    }

    setRole(role: UserRole) {
        this.#localStorageManager.setObjectValue(role);
    }

    getRole() {
        const role = this.#localStorageManager.getObjectValue();

        if (role) {
            return role;
        }

        return DefaultRole;
    }

    clearRole() {
        this.#localStorageManager.clearStorage();
    }
}

export class LocalStorageUserRoleAccessor {
    readonly #localStorageAccessor: LocalStorageAccessor<UserRole>;

    constructor() {
        this.#localStorageAccessor = new LocalStorageAccessor(LocalStorageKey);
    }

    getRole() {
        const role = this.#localStorageAccessor.getObjectValue();

        if (role) {
            return role;
        }

        return DefaultRole;
    }
}
