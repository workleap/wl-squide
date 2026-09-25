import { useRuntime } from "@squide/core";
import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface UseStrictRegistrationModeOptions {
    isEnabled?: boolean;
}

export function useStrictRegistrationMode(options: UseStrictRegistrationModeOptions = {}) {
    const {
        isEnabled = true
    } = options;

    const runtime = useRuntime();

    const subscribe = useCallback((callback: () => void) => {
        runtime.moduleManager.registerModulesReadyListener(callback);

        return () => {
            runtime.moduleManager.removeModulesReadyListener(callback);
        };
    }, [runtime]);

    // This listener is only executed if the modules are ready.
    const areModulesReady = useSyncExternalStore(subscribe, () => runtime.moduleManager.getAreModulesReady());

    useEffect(() => {
        if (areModulesReady && isEnabled) {
            runtime._validateRegistrations();
        }
    }, [runtime, areModulesReady, isEnabled]);
}
