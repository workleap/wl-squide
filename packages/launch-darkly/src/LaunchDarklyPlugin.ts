import { Plugin, Runtime } from "@squide/core";
import { LDClient, LDFlagSet } from "launchdarkly-js-client-sdk";

/*

- Recevoir un LD Client

- Update les deferred registrations quand un feature flag change
    -> Mais uniquement après que les modules soient ready
    -> PAS ÉVIDENT - ÇA PRENDS LE DATA AUSSI, ON LE PRENDS OU!?!

- Les features flags vont toujours être récupéré de LDClient

EXPECTATION:

-> Expect que c'est le consumer qui initialize le client.

-> Expect que le client va être initialize avec un stream.

*/

export const LaunchDarklyPluginName = "launch-darkly-plugin";

export type FeatureFlagsChangedListener = (changes: Record<string, unknown>) => void;

export class LaunchDarklyPlugin extends Plugin {
    readonly #client: LDClient;

    // Taking a snapshot of the feature flags because the LaunchDarkly client
    // always returns a new object which is causing infinite loops with the external hook such as "useSyncExternalStore".
    #featureFlagSetSnapshot: LDFlagSet;

    // Custom listeners ensuring the listeners are notified after the snapshot has been updated.
    readonly #featureFlagsChangedListeners = new Set<FeatureFlagsChangedListener>();

    constructor(runtime: Runtime, launchDarklyClient: LDClient) {
        super(LaunchDarklyPluginName, runtime);

        this.#client = launchDarklyClient;

        // The client is expected to already be initialized. Therefore this call shouldn't
        // trigger a remote call.
        this.#featureFlagSetSnapshot = launchDarklyClient.allFlags();

        this.#registerClientListeners();
    }

    get client() {
        return this.#client;
    }

    get featureFlagSetSnapshot() {
        return this.#featureFlagSetSnapshot;
    }

    getFeatureFlag(key: string, defaultValue?: unknown) {
        return this.#client.variation(key, defaultValue);
    }

    getBooleanFeatureFlag(key: string, defaultValue?: boolean) {
        return this.getFeatureFlag(key, defaultValue) as boolean;
    }

    addFeatureFlagsChangedAndStateIsUpdatedListener(callback: FeatureFlagsChangedListener) {
        this.#featureFlagsChangedListeners.add(callback);
    }

    removeFeatureFlagsChangedAndStateIsUpdatedListener(callback: FeatureFlagsChangedListener) {
        this.#featureFlagsChangedListeners.delete(callback);
    }

    #registerClientListeners() {
        // TODO: Should it really go here?
        this.#client.on("error", error => {
            this._runtime.logger
                .withText("[squide] An error occured with the launch darkly client:")
                .withError(error)
                .error();
        });

        this.#client.on("change", changes => {
            this.#featureFlagSetSnapshot = this.#client.allFlags();

            this.#featureFlagsChangedListeners.forEach(x => {
                x(changes);
            });
        });
    }
}

export function getLaunchDarklyPlugin(runtime: Runtime) {
    return runtime.getPlugin(LaunchDarklyPluginName) as LaunchDarklyPlugin;
}
