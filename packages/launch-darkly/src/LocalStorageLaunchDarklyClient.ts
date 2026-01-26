import type { LDContext, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import type { EditableLaunchDarklyClient, SetFeatureFlagOptions } from "./EditableLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";

export interface LocalStorageLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
};

// To use React features such as "useSyncExternalStore" it's important that methods returning
// object do not create new instances everytime they are executed.
// This cache class help the client achieve this in an elegant way.
class LocalStorageLaunchDarklyClientCache {
    #cache: Map<string, LDFlagValue>;
    #cacheAsObjectLiteral: Record<string, LDFlagValue>;

    constructor(flags: Map<string, LDFlagValue>) {
        this.#cache = flags;
        this.#cacheAsObjectLiteral = Object.fromEntries(flags);
    }

    get value() {
        return this.#cache;
    }

    get objectLiteral() {
        return this.#cacheAsObjectLiteral;
    }
}

export class LocalStorageLaunchDarklyClient implements EditableLaunchDarklyClient {
    readonly #storageKey: string;
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;
    #cache: LocalStorageLaunchDarklyClientCache | undefined;

    private constructor(storageKey: string, options: LocalStorageLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier
        } = options;

        this.#context = context ?? {
            kind: "user",
            anonymous: true
        };

        this.#notifier = notifier ?? new LaunchDarklyClientNotifier();
        this.#storageKey = storageKey;

        // // Listen for local storage changes made in other tabs/windows.
        // this.onStorageUpdated = this.onStorageUpdated.bind(this);
        // window.addEventListener("storage", this.onStorageUpdated);
    }

    static create(storageKey: string, defaultFeatureFlags: Map<string, LDFlagValue>, options: LocalStorageLaunchDarklyClientOptions = {}) {
        const client = new LocalStorageLaunchDarklyClient(
            storageKey,
            options
        );

        let currentFlags: Record<string, LDFlagValue> | undefined;

        try {
            currentFlags = client.allFlags();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: unknown) {
            // If the stored value is not in the right format, it can cause parsing errors.
            currentFlags = {};
        }

        const newFlags = new Map<string, LDFlagValue>();

        // When the client is initialized and there's existing flags, update the existing
        // flags with the new values, remove deprecated flags, and add any new flags.
        if (Object.keys(currentFlags).length > 0) {
            // Update the existing flags with the new values and remove deprecated flags.
            for (const [key, value] of Object.entries(currentFlags)) {
                if (defaultFeatureFlags.has(key)) {
                    newFlags.set(key, value);
                }
            }

            // Add new flags.
            for (const [key, value] of defaultFeatureFlags) {
                if (!newFlags.has(key)) {
                    newFlags.set(key, value);
                }
            }
        // There's no existing flags, initialize client with the new flags.
        } else {
            for (const [key, value] of defaultFeatureFlags) {
                newFlags.set(key, value);
            }
        }

        client.#initializeLocalStorage(newFlags);

        return client;
    }

    #initializeLocalStorage(flags: Map<string, LDFlagValue>) {
        this.#updateLocalStorage(flags);

        // Eagerly set the cache, small optimization.
        this.#cache = new LocalStorageLaunchDarklyClientCache(flags);
    }

    #getFlags() {
        if (!this.#cache) {
            const rawFlags = localStorage.getItem(this.#storageKey);

            if (rawFlags) {
                this.#cache = new LocalStorageLaunchDarklyClientCache(new Map(JSON.parse(rawFlags)));
            }

            if (!this.#cache) {
                this.#cache = new LocalStorageLaunchDarklyClientCache(new Map<string, LDFlagValue>());
            }
        }

        return this.#cache;
    }

    #updateLocalStorage(newFlags: Map<string, LDFlagValue>) {
        localStorage.setItem(this.#storageKey, JSON.stringify([...newFlags]));
    }

    #invalidateCache() {
        this.#cache = undefined;
    }

    waitUntilGoalsReady() {
        return Promise.resolve();
    }

    waitUntilReady() {
        return Promise.resolve();
    }

    waitForInitialization() {
        return Promise.resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(key: string, callback: (...args: any[]) => void) {
        this.#notifier.addListener(key, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(key: string, callback: (...args: any[]) => void) {
        this.#notifier.removeListener(key, callback);
    }

    identify(context: LDContext, hash?: string, onDone?: (err: Error | null, flags: LDFlagSet | null) => void) {
        const flags = this.#getFlags().objectLiteral;

        onDone?.(null, flags);

        return Promise.resolve(flags);
    }

    getContext() {
        return this.#context;
    }

    flush() {
        return Promise.resolve();
    }

    variation(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#getFlags().value.get(key);

        return flag ?? defaultValue;
    }

    variationDetail(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#getFlags().value.get(key);

        return {
            value: flag ?? defaultValue
        };
    }

    setStreaming(): void {}

    track(): void {}

    // IMPORTANT: Must not return a new instance everytime it's executed as it will breaks "useSyncExternalStore".
    allFlags() {
        return this.#getFlags().objectLiteral;
    }

    addHook(): void {}

    close(onDone?: () => void) {
        // window.removeEventListener("storage", this.onStorageUpdated);
        onDone?.();

        return Promise.resolve();
    }

    setFeatureFlags(flags: Record<string, LDFlagValue>, options: SetFeatureFlagOptions = {}): void {
        const {
            notify = true
        } = options;

        const currentFlags = this.#getFlags().value;
        const newFlags = new Map<string, LDFlagValue>(currentFlags);
        const entries = Object.entries(flags);

        if (entries.length > 0) {
            for (const [key, value] of entries) {
                newFlags.set(key, value);
            }

            this.#invalidateCache();
            this.#updateLocalStorage(newFlags);

            if (notify) {
                this.#notifier.notify("change", flags);
            }
        }
    }

    // // Is it really needed?!?!
    // // It might only need to notify that a change happened, but it could also be redundent?!?!
    // // Like will it also be notified of it's own changes?!?!
    // onStorageUpdated(event: StorageEvent) {
    //     if (event.key !== this.#storageKey || !event.newValue) {
    //         return;
    //     }

    //     try {
    //         const newFlag = JSON.parse(event.newValue);
    //         const currentFlags = new Map(Object.entries(this.allFlags()));
    //         const updatedFlags = new Map<string, LDFlagValue>();

    //         for (const [key, value] of Object.entries(newFlag)) {
    //             if (currentFlags.get(key) !== value) {
    //                 updatedFlags.set(key, value);
    //             }
    //         }

    //         if (updatedFlags.size > 0) {
    //             this.setFeatureFlags(Object.fromEntries(updatedFlags));
    //         }
    //     } catch {
    //         // Ignore malformed updates
    //     }
    // }
}

export function createLocalStorageLaunchDarklyClient(storageKey: string, defaultFeatureFlagValues: Map<string, LDFlagValue>, options?: LocalStorageLaunchDarklyClientOptions) {
    return LocalStorageLaunchDarklyClient.create(storageKey, defaultFeatureFlagValues, options);
}
