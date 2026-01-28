import type { LDContext, LDFlagChangeset, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import { CommitTransactionFunction, EditableLaunchDarklyClient, LaunchDarklyClientTransaction, SetFeatureFlagOptions, UndoTransactionFunction } from "./EditableLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";
import { computeChangeset } from "./computeChangeset.ts";
import { FeatureFlags } from "./featureFlags.ts";

export const DefaultLocalStorageKey = "squide-launch-darkly-client";

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

        let changeset: LDFlagChangeset = {};

        try {
            changeset = computeChangeset(
                event.oldValue ? JSON.parse(event.oldValue) as Partial<FeatureFlags> : {},
                JSON.parse(event.newValue) as Partial<FeatureFlags>
            );
        } catch {
            // Ignore parsing errors.
        }

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

function setFlagValues(target: Partial<FeatureFlags>, values: Partial<FeatureFlags>) {
    const keys = Object.keys(values);

    (keys as Array<keyof FeatureFlags>).forEach(x => {
        if (x in target) {
            target[x] = values[x];
        }
    });
}

interface ActiveTransaction {
    transaction: LaunchDarklyClientTransaction;
    deferredNotifications: LDFlagChangeset[];
}

export class LocalStorageLaunchDarklyClient implements EditableLaunchDarklyClient {
    readonly #store: FeatureFlagsLocalStore;
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;
    #flags: Record<string, LDFlagValue>;
    #activeTransaction: ActiveTransaction | undefined;

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
        const newFlags = { ...this.#flags };
        const storedFlags = this.#store.getFlags();

        setFlagValues(newFlags, storedFlags);

        this.#flags = newFlags;
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

    // IMPORTANT: To support "useSyncExternalStore" it's important that the flags object isn't a new reference
    // everytime this method is called.
    allFlags() {
        return this.#flags;
    }

    addHook(): void {}

    close(onDone?: () => void) {
        this.#store.dispose();
        onDone?.();

        return Promise.resolve();
    }

    setFeatureFlags(newValues: Partial<FeatureFlags>, options: SetFeatureFlagOptions = {}): void {
        const {
            notify = true
        } = options;

        const keys = Object.keys(newValues);

        if (keys.length > 0) {
            const originalFlags = this.#flags;
            const newFlags = { ...this.#flags };

            (keys as Array<keyof FeatureFlags>).forEach(x => {
                newFlags[x] = newValues[x];
            });

            this.#flags = newFlags;

            // Where there's an active transaction, delay the persistence of the flags into the local storage
            // until the transaction is committed.
            if (!this.#activeTransaction) {
                this.#store.setFlags(this.#flags);
            }

            if (notify) {
                const changeset = computeChangeset(originalFlags, this.#flags);

                if (this.#activeTransaction) {
                    // Where there's an active transaction, defer the notification until the
                    // transaction is committed.
                    this.#activeTransaction.deferredNotifications.push(changeset);
                } else {
                    this.#notifier.notify("change", changeset);
                }
            }
        }
    }

    startTransaction(): LaunchDarklyClientTransaction {
        if (this.#activeTransaction) {
            throw new Error("[squide] There's already an active LaunchDarkly client transaction. Only one transaction can be started at a time.");
        }

        const commit: CommitTransactionFunction = () => {
            // Once the transation is committed, update the local storage.
            this.#store.setFlags(this.#flags);

            // Once the transaction is committed, process all the deferred notifications.
            this.#activeTransaction?.deferredNotifications.forEach(x => {
                this.#notifier.notify("change", x);
            });

            this.#activeTransaction = undefined;
        };

        const undo: UndoTransactionFunction = (newFlags: Record<string, LDFlagValue>) => {
            this.#flags = newFlags;
            this.#activeTransaction = undefined;
        };

        const transaction = new LaunchDarklyClientTransaction(this.#flags, commit, undo);

        this.#activeTransaction = {
            transaction,
            deferredNotifications: []
        };

        return transaction;
    }
}

export function createLocalStorageLaunchDarklyClient(flags: Partial<FeatureFlags>, options: CreateLocalStorageLaunchDarklyClientOptions = {}) {
    const {
        localStorageKey = DefaultLocalStorageKey,
        ...clientOptions
    } = options;

    const store = new FeatureFlagsLocalStore(localStorageKey);
    const newFlags = { ...flags };

    let storedFlags: Partial<FeatureFlags> | undefined;

    try {
        storedFlags = store.getFlags();
    } catch {
        // If the stored value is not in the right format, it can cause parsing errors.
        storedFlags = {};
    }

    // When there's existing flags, update the provided flags object with the values of the local storage.
    // Only carry over the flags that are not deprecated.
    setFlagValues(newFlags, storedFlags);

    // Keep the local storage up-to-date.
    store.setFlags(newFlags);

    return new LocalStorageLaunchDarklyClient(
        newFlags,
        store,
        clientOptions
    );
}
