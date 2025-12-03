import { Plugin, Runtime } from "@squide/core";
import { LDClient } from "launchdarkly-js-client-sdk";
import { FeatureFlagSetSnapshot } from "./FeatureFlagSetSnapshot.ts";

/*

EXPECTATION:

-> Expect que c'est le consumer qui initialize le client.

-> Expect que le client va être initialize avec un stream.

*/

export const LaunchDarklyPluginName = "launch-darkly-plugin";

export interface LaunchDarklyPluginOptions {
    featureFlagSetSnapshot?: FeatureFlagSetSnapshot;
}

export class LaunchDarklyPlugin extends Plugin {
    readonly #client: LDClient;
    readonly #featureFlagSetSnapshot: FeatureFlagSetSnapshot;

    constructor(runtime: Runtime, launchDarklyClient: LDClient, options: LaunchDarklyPluginOptions = {}) {
        const {
            featureFlagSetSnapshot
        } = options;

        super(LaunchDarklyPluginName, runtime);

        this.#client = launchDarklyClient;
        this.#featureFlagSetSnapshot = featureFlagSetSnapshot ?? new FeatureFlagSetSnapshot(this.#client);

        this.#registerClientListeners();
    }

    get client() {
        return this.#client;
    }

    get featureFlagSetSnapshot() {
        return this.#featureFlagSetSnapshot;
    }

    getFeatureFlag(key: string, defaultValue?: unknown) {
        // It's important to get single flag values from original client "variation" function
        // because there are configurable rules that could influence the returned value.
        return this.#client.variation(key, defaultValue);
    }

    getBooleanFeatureFlag(key: string, defaultValue?: boolean) {
        return this.getFeatureFlag(key, defaultValue) as boolean;
    }

    #registerClientListeners() {
        // TODO: Should it really go here?
        this.#client.on("error", error => {
            this._runtime.logger
                .withText("[squide] An error occured with the launch darkly client:")
                .withError(error)
                .error();
        });
    }
}

export function getLaunchDarklyPlugin(runtime: Runtime) {
    return runtime.getPlugin(LaunchDarklyPluginName) as LaunchDarklyPlugin;
}
