import { Plugin, Runtime } from "@squide/core";
import { LDClient } from "launchdarkly-js-client-sdk";
import { FeatureFlagSetSnapshot } from "./FeatureFlagSetSnapshot.ts";
import { FeatureFlagKey, FeatureFlags } from "./featureFlags.ts";

export const LaunchDarklyPluginName = "launch-darkly-plugin";

export class LaunchDarklyPlugin extends Plugin {
    readonly #client: LDClient;
    readonly #featureFlagSetSnapshot: FeatureFlagSetSnapshot;

    constructor(runtime: Runtime, launchDarklyClient: LDClient) {
        super(LaunchDarklyPluginName, runtime);

        this.#client = launchDarklyClient;
        this.#featureFlagSetSnapshot = new FeatureFlagSetSnapshot(this.#client);

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
