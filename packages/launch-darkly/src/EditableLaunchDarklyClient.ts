import type { LDClient } from "launchdarkly-js-client-sdk";
import { FeatureFlags } from "./featureFlags.ts";

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
}

export function isEditableLaunchDarklyClient<T extends LDClient>(client: T): client is T & EditableLaunchDarklyClient {
    return typeof (client as unknown as EditableLaunchDarklyClient).setFeatureFlags === "function";
}
