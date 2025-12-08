import { FeatureFlagKey } from "./featureFlags.ts";
import { useFeatureFlag } from "./useFeatureFlag.ts";

export function useBooleanFeatureFlag(key: FeatureFlagKey, defaultValue?: boolean) {
    // The error is because the FeatureFlags interface is empty as it is expected to be augmented by the
    // consumer application.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return useFeatureFlag(key, defaultValue) as boolean;
}
