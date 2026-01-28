import type { LDContext, LDFlagChangeset, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import type { EditableLaunchDarklyClient, SetFeatureFlagOptions } from "./EditableLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";
import { computeChangeset } from "./computeChangeset.ts";
import { FeatureFlags } from "./featureFlags.ts";

const DefaultLocalStorageKey = "squide-launch-darkly-client";

export interface LocalStorageLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
};

export interface CreateLocalStorageLaunchDarklyClientOptions extends LocalStorageLaunchDarklyClientOptions {
    localStorageKey?: string;
}

export type FeatureFlagsLocalStoreChangedListener = (changeset: LDFlagChangeset) => void;

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

        const changeset = computeChangeset(event.oldValue as Partial<FeatureFlags>, event.newValue as Partial<FeatureFlags>);

        this.#listeners.forEach(x => {
            x(changeset);
        });
    }

    getFlags(): Partial<FeatureFlags> {
        const rawFlags = localStorage.getItem(this.#key);

        return rawFlags
            ? JSON.parse(rawFlags)
            : {};
    }

    setFlags(newFlags: Partial<FeatureFlags>) {
        localStorage.setItem(this.#key, JSON.stringify(newFlags));
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

export class LocalStorageLaunchDarklyClient implements EditableLaunchDarklyClient {
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;
    #flags: Record<string, LDFlagValue>;
    #store: FeatureFlagsLocalStore;

    constructor(flags: Partial<FeatureFlags>, store: FeatureFlagsLocalStore, options: LocalStorageLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier = new LaunchDarklyClientNotifier()
        } = options;

        this.#context = context ?? {
            kind: "user",
            anonymous: true
        };

        this.#flags = flags;
        this.#store = store;
        this.#notifier = notifier;

        // Update this client when the feature flags are changed in other tabs/windows.
        this.#store.addChangedListener(this.#handleStoreChanged.bind(this));
    }

    #handleStoreChanged(changeset: LDFlagChangeset) {
        const storedFlags = this.#store.getFlags();

        // IMPORTANT: Update the provided flags object to support "withFeatureFlagsOverrideDecorator".
        setFlagValues(this.#flags, storedFlags);

        this.#notifier.notify("change", changeset);
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
        onDone?.(null, this.#flags);

        return Promise.resolve(this.#flags);
    }

    getContext() {
        return this.#context;
    }

    flush() {
        return Promise.resolve();
    }

    variation(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#flags[key];

        return flag ?? defaultValue;
    }

    variationDetail(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#flags[key];

        return {
            value: flag ?? defaultValue
        };
    }

    setStreaming(): void {}

    track(): void {}

    // IMPORTANT-1: Must return the flags object provided to the "ctor" to support "withFeatureFlagsOverrideDecorator".
    // IMPORTANT-2: To support "useSyncExternalStore" it's also important that the flags object isn't a new reference everytime
    // this method is called.
    allFlags() {
        return this.#flags;
    }

    addHook(): void {}

    close(onDone?: () => void) {
        this.#store.dispose();
        onDone?.();

        return Promise.resolve();
    }

    setFeatureFlags(newFlags: Partial<FeatureFlags>, options: SetFeatureFlagOptions = {}): void {
        const {
            notify = true
        } = options;

        const newFlagsKeys = Object.keys(newFlags);

        if (newFlagsKeys.length > 0) {
            const originalFlags = { ...this.#flags };

            (newFlagsKeys as Array<keyof FeatureFlags>).forEach(x => {
                this.#flags[x] = newFlags[x];
            });

            this.#store.setFlags(this.#flags);

            if (notify) {
                const changeset = computeChangeset(originalFlags, this.#flags);

                this.#notifier.notify("change", changeset);
            }
        }
    }
}

function setFlagValues(target: Partial<FeatureFlags>, values: Partial<FeatureFlags>) {
    const keys = Object.keys(values);

    (keys as Array<keyof FeatureFlags>).forEach(x => {
        if (x in target) {
            target[x] = values[x];
        }
    });
}

// TODO: move storage key as an option
export function createLocalStorageLaunchDarklyClient(flags: Partial<FeatureFlags>, options: CreateLocalStorageLaunchDarklyClientOptions = {}) {
    const {
        localStorageKey = DefaultLocalStorageKey,
        ...clientOptions
    } = options;

    const store = new FeatureFlagsLocalStore(localStorageKey);

    let storedFlags: Partial<FeatureFlags> | undefined;

    try {
        storedFlags = store.getFlags();
    } catch {
        // If the stored value is not in the right format, it can cause parsing errors.
        storedFlags = {};
    }

    // When there's existing flags, update the provided flags object with the values of the local storage.
    // Only carry over the flags that are not deprecated.
    // IMPORTANT: Update the provided flags object to support "withFeatureFlagsOverrideDecorator".
    setFlagValues(flags, storedFlags);

    // Keep the local storage up-to-date.
    store.setFlags(flags);

    return new LocalStorageLaunchDarklyClient(
        flags,
        store,
        clientOptions
    );
}
