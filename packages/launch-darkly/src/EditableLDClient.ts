import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";

export interface SetFlagOptions {
    /**
     * If true, the client will notify subscribers of the flag change.
     * @default true
     */
    notify?: boolean;
}

export interface EditableLDClient extends LDClient {
    /**
     * Sets a feature flag to the specified value.
     */
    setFeatureFlag(name: string, value: LDFlagValue, options?: SetFlagOptions): void;
    /**
     * Sets multiple feature flags to the specified values.
     */
    setFeatureFlags(flags: Record<string, LDFlagValue>, options?: SetFlagOptions): void;
}

export function isEditableLDClient(client: LDClient): client is EditableLDClient {
    return typeof (client as EditableLDClient).setFeatureFlag === "function"
        && typeof (client as EditableLDClient).setFeatureFlags === "function";
}
