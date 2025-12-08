import { LDClient } from "launchdarkly-js-client-sdk";
import { FeatureFlagKey, FeatureFlags } from "./featureFlags.ts";

export function getFeatureFlag<T extends FeatureFlagKey>(launchDarklyClient: LDClient, key: T, defaultValue?: FeatureFlags[T]) {
    return launchDarklyClient.variation(key, defaultValue) as FeatureFlags[T];
}
