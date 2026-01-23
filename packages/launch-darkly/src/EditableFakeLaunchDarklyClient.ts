import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";

export interface SetFlagOptions {
    /**
     * If true, the client will notify subscribers of the flag change.
     * @default true
     */
    notify?: boolean;
}

export interface EditableFakeLaunchDarklyClient extends LDClient {
    /**
     * Sets multiple feature flags to the specified values.
     */
    setFeatureFlags(flags: Record<string, LDFlagValue>, options?: SetFlagOptions): void;
}

export function isEditableFakeLaunchDarklyClient(client: LDClient): client is EditableFakeLaunchDarklyClient {
    return typeof (client as EditableFakeLaunchDarklyClient).setFeatureFlags === "function";
}
