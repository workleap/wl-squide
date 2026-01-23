import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";

export interface SetFlagOptions {
    /**
     * If true, the client will notify subscribers of the flag change.
     * @default true
     */
    notify?: boolean;
}

export interface EditableLaunchDarklyClient extends LDClient {
    /**
     * Sets a feature flag to the specified value.
     */
    setFeatureFlag(name: string, value: LDFlagValue, options?: SetFlagOptions): void;
    /**
     * Sets multiple feature flags to the specified values.
     */
    setFeatureFlags(flags: Record<string, LDFlagValue>, options?: SetFlagOptions): void;
}

export function isEditableFakeLaunchDarklyClient(client: LDClient): client is EditableLaunchDarklyClient {
    return typeof (client as EditableLaunchDarklyClient).setFeatureFlag === "function"
        && typeof (client as EditableLaunchDarklyClient).setFeatureFlags === "function";
}
