import { useCallback, useSyncExternalStore } from "react";
import { useI18nextPlugin } from "./useI18nextPlugin.ts";

export function useCurrentLanguage() {
    const plugin = useI18nextPlugin();

    const subscribe = useCallback((callback: () => void) => {
        plugin.registerLanguageChangedListener(callback);

        return () => {
            plugin.removeLanguageChangedListener(callback);
        };
    }, [plugin]);

    return useSyncExternalStore(subscribe, () => plugin.currentLanguage);
}
