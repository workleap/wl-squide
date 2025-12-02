import { LDClient } from "launchdarkly-js-client-sdk";

export function getBooleanFeatureFlag(launchDarklyClient: LDClient, key: string, defaultValue?: boolean) {
    return launchDarklyClient.variation(key, defaultValue) as boolean;
}
