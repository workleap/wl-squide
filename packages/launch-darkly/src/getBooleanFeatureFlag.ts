import { LDClient } from "launchdarkly-js-client-sdk";
import { FeatureFlagKey } from "./featureFlags.ts";

export function getBooleanFeatureFlag<T extends FeatureFlagKey>(launchDarklyClient: LDClient, key: T, defaultValue?: boolean) {
    return launchDarklyClient.variation(key, defaultValue) as boolean;
}
