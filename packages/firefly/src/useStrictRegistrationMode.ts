import { Runtime, useRuntime } from "@squide/core";
import { useEffect, useSyncExternalStore } from "react";

function subscribeToModulesReady(runtime: Runtime) {
    return (callback: () => void) => {
        runtime.moduleManager.registerModulesReadyListener(callback);

        return () => runtime.moduleManager.removeModulesReadyListener(callback);
    };
}

export function useStrictRegistrationMode() {
    const runtime = useRuntime();

    // This listener is only executed if the modules are ready.
    const areModulesReady = useSyncExternalStore(subscribeToModulesReady(runtime), () => runtime.moduleManager.getAreModulesReady());

    useEffect(() => {
        if (areModulesReady) {
            runtime._validateRegistrations();
        }
    }, [runtime, areModulesReady]);
}
