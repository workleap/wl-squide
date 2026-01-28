import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";
import { FeatureFlags } from "./featureFlags.ts";

export type CommitTransactionFunction = () => void;
export type UndoTransactionFunction = (originalFlags: Record<string, LDFlagValue>) => void;

export class LaunchDarklyClientTransaction {
    readonly #originalFlags: Record<string, LDFlagValue>;
    readonly #commit: CommitTransactionFunction;
    readonly #undo: UndoTransactionFunction;
    #isActive = true;

    constructor(originalFlags: Record<string, LDFlagValue>, commit: CommitTransactionFunction, undo: UndoTransactionFunction) {
        this.#originalFlags = originalFlags;
        this.#commit = commit;
        this.#undo = undo;
    }

    #ensureIsActive() {
        if (!this.#isActive) {
            throw new Error("[squide] Cannot execute methods on a completed LaunchDarkly client transaction.");
        }
    }

    #setAsCompleted() {
        this.#isActive = false;
    }

    get isActive() {
        return this.#isActive;
    }

    commit() {
        this.#ensureIsActive();
        this.#commit();
        this.#setAsCompleted();
    }

    undo() {
        this.#ensureIsActive();
        // IMPORTANT: Restore the same object when a transaction is undo for "useSyncExternalStore" support.
        this.#undo(this.#originalFlags);
        this.#setAsCompleted();
    }
}

export interface SetFeatureFlagOptions {
    /**
     * If true, the client will notify subscribers of the flag change.
     * @default true
     */
    notify?: boolean;
}

export interface EditableLaunchDarklyClient extends LDClient {
    /**
     * Sets multiple feature flags to the specified values.
     */
    setFeatureFlags(flags: Partial<FeatureFlags>, options?: SetFeatureFlagOptions): void;

    /**
     * Start a transaction to edit the feature flags.
     */
    startTransaction(): LaunchDarklyClientTransaction;
}

export function isEditableLaunchDarklyClient<T extends LDClient>(client: T): client is T & EditableLaunchDarklyClient {
    return typeof (client as unknown as EditableLaunchDarklyClient).setFeatureFlags === "function";
}
