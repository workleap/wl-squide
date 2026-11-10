import { useCallback } from "react";
import { useI18nextPlugin } from "./useI18nextPlugin.ts";

export function useChangeLanguage<T extends string>() {
    const plugin = useI18nextPlugin();

    return useCallback(
        (language: T) => {
            return plugin.changeLanguage(language);
        },
        [plugin]
    );
}
