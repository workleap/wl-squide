import { LDClient, type LDFlagChangeset } from "launchdarkly-js-client-sdk";
import { FeatureFlags } from "./featureFlags.ts";

export type FeatureFlagSetSnapshotChangedListener = (snapshot: FeatureFlags, changes: LDFlagChangeset) => void;

// Maintaining a snapshot of the feature flags because the LaunchDarkly client always return
// a new object, which is causing infinite loops with external hooks such as "useSyncExternalStore".
export class FeatureFlagSetSnapshot {
    readonly #client: LDClient;
    readonly #listeners = new Set<FeatureFlagSetSnapshotChangedListener>();
    #snapshot: FeatureFlags;

    constructor(launchDarklyClient: LDClient) {
        this.#client = launchDarklyClient;

        // The client is expected to be already initialized. Therefore this call shouldn't trigger a remote call.
        // Furthermore, when the client is initialized, all the flags are automatically fetched, therefore this function execution
        // shouldn't attempt to fetch additional feature flags.
        this.#snapshot = this.#client.allFlags() as FeatureFlags;

        this.#client.on("change", changes => {
            this.#snapshot = this.#client.allFlags() as FeatureFlags;

            this.#listeners.forEach(x => {
                x(this.#snapshot, changes);
            });
        });
    }

    get value() {
        return this.#snapshot;
    }

    addSnapshotChangedListener(callback: FeatureFlagSetSnapshotChangedListener) {
        this.#listeners.add(callback);
    }

    removeSnapshotChangedListener(callback: FeatureFlagSetSnapshotChangedListener) {
        this.#listeners.delete(callback);
    }
}
