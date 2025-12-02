import { useFeatureFlag } from "./useFeatureFlag.ts";

export function useBooleanFeatureFlag(key: string, defaultValue?: boolean) {
    return useFeatureFlag(key, defaultValue) as boolean;
}
