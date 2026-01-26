import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";

export interface SetFeatureFlagOptions {
    /**
     * If true, the client will notify subscribers of the flag change.
     * @default true
     */
    notify?: boolean;
}

export interface EditableLaunchDarklyClient<T extends string = string> extends LDClient {
    /**
     * Sets multiple feature flags to the specified values.
     */
    setFeatureFlags(flags: Partial<Record<T, LDFlagValue>>, options?: SetFeatureFlagOptions): void;
}

export function isEditableLaunchDarklyClient<TClient extends LDClient>(client: TClient): client is TClient & EditableLaunchDarklyClient {
    return typeof (client as unknown as EditableLaunchDarklyClient).setFeatureFlags === "function";
}
