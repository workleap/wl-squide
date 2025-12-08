import { Plugin, Runtime } from "@squide/core";
import { LDClient } from "launchdarkly-js-client-sdk";
import { FeatureFlagSetSnapshot } from "./FeatureFlagSetSnapshot.ts";
import { FeatureFlagKey, FeatureFlags } from "./featureFlags.ts";

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

    getFeatureFlag<T extends FeatureFlagKey>(key: T, defaultValue?: FeatureFlags[T]) {
        // It's important to get single flag values from the original client "variation" function
        // because there are configurable rules that could influence the returned value.
        return this.#client.variation(key, defaultValue) as FeatureFlags[T];
    }

    getBooleanFeatureFlag(key: FeatureFlagKey, defaultValue?: boolean) {
        // The error is because the FeatureFlags interface is empty as it is expected to be augmented by the
        // consumer application.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    const plugin = runtime.getPlugin(LaunchDarklyPluginName, {
        throwOnNotFound: false
    }) as LaunchDarklyPlugin;

    if (!plugin) {
        throw new Error("[squide] The getLaunchDarklyPlugin function is called but no LaunchDarklyPlugin instance has been registered with the runtime. Did you provide a LaunchDarkly client instance to either the runtime instance, the initializeFirefly function, or the initializeFireflyForStorybook function?");
    }

    return plugin;
}
