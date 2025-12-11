import { useRuntime } from "@squide/core";
import { useCallback, useSyncExternalStore } from "react";
import { FeatureFlagSetSnapshotChangedListener } from "./FeatureFlagSetSnapshot.ts";
import { getLaunchDarklyPlugin } from "./LaunchDarklyPlugin.ts";
import { FeatureFlagKey, FeatureFlags } from "./featureFlags.ts";

export function useFeatureFlag<T extends FeatureFlagKey>(key: T, defaultValue?: FeatureFlags[T]) {
    const runtime = useRuntime();
    const plugin = getLaunchDarklyPlugin(runtime);

    const subscribe = useCallback((callback: () => void) => {
        const listener: FeatureFlagSetSnapshotChangedListener = (_, changes: Partial<FeatureFlags>) => {
            if (changes) {
                if (Object.keys(changes).includes(key)) {
                    callback();
                }
            }
        };

        plugin.featureFlagSetSnapshot.addSnapshotChangedListener(listener);

        return () => {
            plugin.featureFlagSetSnapshot.removeSnapshotChangedListener(listener);
        };
    }, [key, plugin]);

    return useSyncExternalStore(subscribe, () => plugin.client.variation(key, defaultValue) as FeatureFlags[T]);
}
