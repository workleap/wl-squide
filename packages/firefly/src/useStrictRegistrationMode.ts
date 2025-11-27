import { Runtime, useRuntime } from "@squide/core";
import { useEffect, useSyncExternalStore } from "react";

function subscribeToModulesReady(runtime: Runtime) {
    return (callback: () => void) => {
        runtime.moduleManager.registerModulesReadyListener(callback);

        return () => runtime.moduleManager.removeModulesReadyListener(callback);
    };
}

export interface UseStrictRegistrationModeOptions {
    isEnabled?: boolean;
}

export function useStrictRegistrationMode(options: UseStrictRegistrationModeOptions = {}) {
    const {
        isEnabled = true
    } = options;

    const runtime = useRuntime();

    // This listener is only executed if the modules are ready.
    const areModulesReady = useSyncExternalStore(subscribeToModulesReady(runtime), () => runtime.moduleManager.getAreModulesReady());

    useEffect(() => {
        if (areModulesReady && isEnabled) {
            runtime._validateRegistrations();
        }
    }, [runtime, areModulesReady, isEnabled]);
}
