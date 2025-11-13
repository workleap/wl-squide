// import { addLocalModuleRegistrationStatusChangedListener, getLocalModuleRegistrationStatus, removeLocalModuleRegistrationStatusChangedListener, useRuntime } from "@squide/core";
import { Runtime, useRuntime } from "@squide/core";
import { addRemoteModuleRegistrationStatusChangedListener, areModulesReady, getRemoteModuleRegistrationStatus, removeRemoteModuleRegistrationStatusChangedListener } from "@squide/module-federation";
import { useEffect, useSyncExternalStore } from "react";

function subscribeToLocalModuleRegistrationStatusChanged(runtime: Runtime) {
    return (callback: () => void) => {
        runtime.localModulesRegistry.registerStatusChangedListener(callback);

        return () => runtime.localModulesRegistry.removeStatusChangedListener(callback);
    };
}

function subscribeToRemoteModuleRegistrationStatusChanged(callback: () => void) {
    addRemoteModuleRegistrationStatusChangedListener(callback);

    return () => removeRemoteModuleRegistrationStatusChangedListener(callback);
}

export function useStrictRegistrationMode() {
    const runtime = useRuntime();

    const localModuleStatus = useSyncExternalStore(subscribeToLocalModuleRegistrationStatusChanged(runtime), () => runtime.localModulesRegistry.registrationStatus);
    const remoteModuleStatus = useSyncExternalStore(subscribeToRemoteModuleRegistrationStatusChanged, getRemoteModuleRegistrationStatus);

    useEffect(() => {
        if (areModulesReady(localModuleStatus, remoteModuleStatus)) {
            runtime._validateRegistrations();
        }
    }, [runtime, localModuleStatus, remoteModuleStatus]);
}
