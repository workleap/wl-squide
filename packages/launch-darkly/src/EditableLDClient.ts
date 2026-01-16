import type { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";

export interface EditableLDClient extends LDClient {
    setFeatureFlag(name: string, value: LDFlagValue): void;
    setFeatureFlags(flags: Record<string, LDFlagValue>): void;
}

export function isEditableLDClient(client: LDClient): client is EditableLDClient {
    return typeof (client as EditableLDClient).setFeatureFlag === "function"
        && typeof (client as EditableLDClient).setFeatureFlags === "function";
}
