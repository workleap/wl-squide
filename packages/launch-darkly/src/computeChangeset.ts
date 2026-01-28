import type { LDFlagChangeset } from "launchdarkly-js-sdk-common";
import type { FeatureFlags } from "./featureFlags.ts";

export function computeChangeset(currentFlags: Partial<FeatureFlags>, newFlags: Partial<FeatureFlags>) {
    const changeset: LDFlagChangeset = {};

    // Get all unique keys from both objects.
    const allKeys = new Set([...Object.keys(currentFlags), ...Object.keys(newFlags)]);

    allKeys.forEach(x => {
        const previousValue = currentFlags[x as keyof FeatureFlags];
        const currentValue = newFlags[x as keyof FeatureFlags];

        // Check if the values are different (using JSON.stringify for deep comparison since a flag can be any JSON serializable value).
        if (JSON.stringify(previousValue) !== JSON.stringify(currentValue)) {
            changeset[x] = {
                current: currentValue,
                previous: previousValue
            };
        }
    });

    return changeset;
}
