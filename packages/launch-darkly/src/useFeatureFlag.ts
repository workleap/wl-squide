import { useCallback, useSyncExternalStore } from "react";
import { useLaunchDarklyClient } from "./useLaunchDarklyClient.ts";

export function useFeatureFlag(key: string, defaultValue?: unknown) {
    const client = useLaunchDarklyClient();

    const subscribe = useCallback((callback: () => void) => {
        const listener = (changes: Record<string, unknown>) => {
            if (changes) {
                if (Object.keys(changes).includes(key)) {
                    callback();
                }
            }
        };

        client.on("change", listener);

        return () => {
            client.off("change", listener);
        };
    }, [key, client]);

    return useSyncExternalStore(subscribe, () => client.variation(key, defaultValue));
}
