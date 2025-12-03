import { useRuntime } from "@squide/core";
import { useCallback, useSyncExternalStore } from "react";
import { getLaunchDarklyPlugin } from "./LaunchDarklyPlugin.ts";

/**
 * Returns a map of all available flags to the current context's values.
 * @returns An object in which each key is a feature flag key and each value is the flag value.
 * Note that there is no way to specify a default value for each flag as there is with variation, so any flag that cannot be evaluated will have a null value.
 */
export function useFeatureFlags() {
    const runtime = useRuntime();
    const plugin = getLaunchDarklyPlugin(runtime);

    const subscribe = useCallback((callback: () => void) => {
        plugin.addFeatureFlagsChangedListener(callback);

        return () => {
            plugin.removeFeatureFlagsChangedListener(callback);
        };
    }, [plugin]);

    return useSyncExternalStore(subscribe, () => plugin.featureFlagSetSnapshot);
}
