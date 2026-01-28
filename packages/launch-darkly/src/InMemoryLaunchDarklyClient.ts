import { LDContext, LDFlagChangeset, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import { computeChangeset } from "./computeChangeset.ts";
import { LaunchDarklyClientTransaction, type CommitTransactionFunction, type EditableLaunchDarklyClient, type SetFeatureFlagOptions, type UndoTransactionFunction } from "./EditableLaunchDarklyClient.ts";
import { FeatureFlags } from "./featureFlags.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";

export interface InMemoryLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
}

interface ActiveTransaction {
    transaction: LaunchDarklyClientTransaction;
    deferredNotifications: LDFlagChangeset[];
}

export class InMemoryLaunchDarklyClient implements EditableLaunchDarklyClient {
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;
    #flags: Record<string, LDFlagValue>;
    #activeTransaction: ActiveTransaction | undefined;

    constructor(featureFlags: Partial<FeatureFlags>, options: InMemoryLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier = new LaunchDarklyClientNotifier()
        } = options;

        this.#flags = featureFlags;

        this.#context = context ?? {
            kind: "user",
            anonymous: true
        };

        this.#notifier = notifier;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(key: string, callback: (...args: any[]) => void) {
        this.#notifier.addListener(key, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(key: string, callback: (...args: any[]) => void) {
        this.#notifier.removeListener(key, callback);
    }

    track(): void {}

    // IMPORTANT: To support "useSyncExternalStore" it's important that the flags object isn't a new reference
    // everytime this method is called.
    allFlags() {
        return this.#flags;
    }

    close(onDone?: () => void) {
        onDone?.();

        return Promise.resolve();
    }

    addHook(): void {}

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

    startTransaction() {
        if (this.#activeTransaction) {
            throw new Error("[squide] There's already an active LaunchDarkly client transaction. Only one transaction can be started at a time.");
        }

        const commit: CommitTransactionFunction = () => {
            // Once the transaction is committed, process all the pending notifications.
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
