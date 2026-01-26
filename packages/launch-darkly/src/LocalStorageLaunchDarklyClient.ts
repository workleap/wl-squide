import type { LDContext, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import type { EditableLaunchDarklyClient, SetFeatureFlagOptions } from "./EditableLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";

export interface LocalStorageLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
};

export type FeatureFlagsLocalStoreChangedListener = () => void;

class FeatureFlagsLocalStore {
    readonly #key: string;
    readonly #listeners = new Set<FeatureFlagsLocalStoreChangedListener>();
    readonly #changedListener: (event: StorageEvent) => void;

    constructor(key: string) {
        this.#key = key;
        this.#changedListener = this.#handleChanged.bind(this);

        window.addEventListener("storage", this.#changedListener);
    }

    #handleChanged(event: StorageEvent) {
        if (event.key !== this.#key || !event.newValue) {
            return;
        }

        this.#listeners.forEach(x => {
            x();
        });
    }

    getFlags() {
        const rawFlags = localStorage.getItem(this.#key);

        return rawFlags
            ? new Map(JSON.parse(rawFlags) as Map<string, LDFlagValue>)
            : new Map<string, LDFlagValue>();
    }

    setFlags(newFlags: Map<string, LDFlagValue>) {
        localStorage.setItem(this.#key, JSON.stringify([...newFlags]));
    }

    addChangedListener(callback: FeatureFlagsLocalStoreChangedListener) {
        this.#listeners.add(callback);
    }

    removeChangedListener(callback: FeatureFlagsLocalStoreChangedListener) {
        this.#listeners.delete(callback);
    }

    dispose() {
        window.removeEventListener("storage", this.#changedListener);
        this.#listeners.clear();
    }
}

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

export class LocalStorageLaunchDarklyClient<T extends string = string> implements EditableLaunchDarklyClient<T> {
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;
    #store: FeatureFlagsLocalStore;
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

        this.#store = new FeatureFlagsLocalStore(storageKey);
        this.#store.addChangedListener(this.#handleStoreChanged.bind(this));
    }

    static create<const T extends string>(storageKey: string, defaultFeatureFlags: Map<T, LDFlagValue>, options: LocalStorageLaunchDarklyClientOptions = {}) {
        const client = new LocalStorageLaunchDarklyClient<T>(
            storageKey,
            options
        );

        let currentFlags: Map<string, LDFlagValue> | undefined;

        try {
            currentFlags = client.#store.getFlags();
        } catch {
            // If the stored value is not in the right format, it can cause parsing errors.
            currentFlags = new Map<string, LDFlagValue>();
        }

        const newFlags = new Map<string, LDFlagValue>();

        // When the client is initialized and there's existing flags, update the existing
        // flags with the new values, remove deprecated flags, and add any new flags.
        if (currentFlags.size > 0) {
            // Update the existing flags with the new values and remove deprecated flags.
            for (const [key, value] of currentFlags) {
                if (defaultFeatureFlags.has(key as T)) {
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

        client.#store.setFlags(newFlags);

        return client;
    }

    #getFlags() {
        if (!this.#cache) {
            this.#cache = new LocalStorageLaunchDarklyClientCache(this.#store.getFlags());
        }

        return this.#cache;
    }

    #handleStoreChanged() {
        // Force the client to read from the local storage the next time
        // the flags are requested.
        this.#invalidateCache();

        this.#notifier.notify("change");
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
        this.#store.dispose();
        onDone?.();

        return Promise.resolve();
    }

    setFeatureFlags(flags: Partial<Record<T, LDFlagValue>>, options: SetFeatureFlagOptions = {}): void {
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

            this.#store.setFlags(newFlags);
            this.#invalidateCache();

            if (notify) {
                this.#notifier.notify("change");
            }
        }
    }
}

export function createLocalStorageLaunchDarklyClient<const T extends string>(storageKey: string, defaultFeatureFlagValues: Map<T, LDFlagValue>, options?: LocalStorageLaunchDarklyClientOptions) {
    return LocalStorageLaunchDarklyClient.create(storageKey, defaultFeatureFlagValues, options);
}
