import { useRuntime } from "@squide/core";
import { useCallback, useSyncExternalStore } from "react";
import { getLaunchDarklyPlugin } from "./LaunchDarklyPlugin.ts";

export function useFeatureFlags() {
    const runtime = useRuntime();
    const plugin = getLaunchDarklyPlugin(runtime);

    const subscribe = useCallback((callback: () => void) => {
        plugin.featureFlagSetSnapshot.addSnapshotChangedListener(callback);

        return () => {
            plugin.featureFlagSetSnapshot.removeSnapshotChangedListener(callback);
        };
    }, [plugin]);

    return useSyncExternalStore(subscribe, () => plugin.featureFlagSetSnapshot.value);
}
