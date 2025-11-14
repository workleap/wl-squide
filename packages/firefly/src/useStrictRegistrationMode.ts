// import { addLocalModuleRegistrationStatusChangedListener, getLocalModuleRegistrationStatus, removeLocalModuleRegistrationStatusChangedListener, useRuntime } from "@squide/core";
import { Runtime, useRuntime } from "@squide/core";
import { useEffect, useSyncExternalStore } from "react";

// function subscribeToLocalModuleRegistrationStatusChanged(runtime: Runtime) {
//     return (callback: () => void) => {
//         runtime.localModulesRegistry.registerStatusChangedListener(callback);

//         return () => runtime.localModulesRegistry.removeStatusChangedListener(callback);
//     };
// }

// function subscribeToRemoteModuleRegistrationStatusChanged(callback: () => void) {
//     addRemoteModuleRegistrationStatusChangedListener(callback);

//     return () => removeRemoteModuleRegistrationStatusChangedListener(callback);
// }

function subscribeToModulesReady(runtime: Runtime) {
    return (callback: () => void) => {
        runtime.moduleManager.registerModulesReadyListener(callback);

        return () => runtime.moduleManager.removeModulesReadyListener(callback);
    };
}

export function useStrictRegistrationMode() {
    const runtime = useRuntime();

    // const localModuleStatus = useSyncExternalStore(subscribeToLocalModuleRegistrationStatusChanged(runtime), () => runtime.localModulesRegistry.registrationStatus);
    // const remoteModuleStatus = useSyncExternalStore(subscribeToRemoteModuleRegistrationStatusChanged, getRemoteModuleRegistrationStatus);

    // This listener is only executed if the modules are ready.
    const areModulesReady = useSyncExternalStore(subscribeToModulesReady(runtime), () => runtime.moduleManager.getAreModulesReady());

    useEffect(() => {
        if (areModulesReady) {
            runtime._validateRegistrations();
        }
    }, [runtime, areModulesReady]);
}
