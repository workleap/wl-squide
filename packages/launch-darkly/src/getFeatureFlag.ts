import type { LDClient } from "launchdarkly-js-client-sdk";
import type { FeatureFlagKey, FeatureFlags } from "./featureFlags.ts";

export function getFeatureFlag<T extends FeatureFlagKey>(launchDarklyClient: LDClient, key: T, defaultValue?: FeatureFlags[T]) {
    return launchDarklyClient.variation(key, defaultValue) as FeatureFlags[T];
}
