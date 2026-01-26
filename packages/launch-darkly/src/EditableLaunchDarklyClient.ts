import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";

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
    setFeatureFlags(flags: Record<string, LDFlagValue>, options?: SetFeatureFlagOptions): void;
}

export function isEditableLaunchDarklyClient(client: LDClient): client is EditableLaunchDarklyClient {
    return typeof (client as EditableLaunchDarklyClient).setFeatureFlags === "function";
}
