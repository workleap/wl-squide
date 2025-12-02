import { isNil, Plugin, Runtime } from "@squide/core";
import { LDClient } from "launchdarkly-js-client-sdk";
import { getBooleanFeatureFlag } from "./getBooleanFeatureFlag.ts";

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

export class LaunchDarklyPlugin extends Plugin {
    readonly #launchDarklyClient: LDClient;

    constructor(runtime: Runtime, launchDarklyClient: LDClient) {
        super(LaunchDarklyPluginName, runtime);

        this.#launchDarklyClient = launchDarklyClient;

        this.#registerLoggingListeners();
    }

    get client() {
        return this.#launchDarklyClient;
    }

    getBooleanFeatureFlag(key: string, defaultValue?: boolean) {
        return getBooleanFeatureFlag(this.#launchDarklyClient, key, defaultValue);
    }

    #registerLoggingListeners() {
        this.#launchDarklyClient.on("error", error => {
            this._runtime.logger
                .withText("[launch-darkly] An error occured with the client:")
                .withError(error)
                .error();
        });

        this.#launchDarklyClient.on("change", changes => {
            this._runtime.logger
                .withText("[launch-darkly] Feature flags changed:")
                .withObject(changes)
                .debug();
        });
    }
}

export function getLaunchDarklyPlugin(runtime: Runtime) {
    const plugin = runtime.getPlugin(LaunchDarklyPluginName);

    if (isNil(plugin)) {
        throw new Error("[squide] The getLaunchDarklyPlugin function is called but no LaunchDarklyPlugin instance has been registered with the runtime.");
    }

    return plugin as LaunchDarklyPlugin;
}
