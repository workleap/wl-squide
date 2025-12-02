import { useEffect } from "react";
import { useLaunchDarklyClient } from "./useLaunchDarklyClient.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeatureFlagsChangedListener = (args: any[]) => void;

export function useFeatureFlagsChangedListener(listener: FeatureFlagsChangedListener) {
    const client = useLaunchDarklyClient();

    useEffect(() => {
        client.on("change", listener);

        return () => {
            client.off("change", listener);
        };
    }, [client]);
}
