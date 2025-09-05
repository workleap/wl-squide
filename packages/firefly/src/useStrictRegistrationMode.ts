import { addLocalModuleRegistrationStatusChangedListener, getLocalModuleRegistrationStatus, removeLocalModuleRegistrationStatusChangedListener, useRuntime } from "@squide/core";
import { addRemoteModuleRegistrationStatusChangedListener, areModulesReady, getRemoteModuleRegistrationStatus, removeRemoteModuleRegistrationStatusChangedListener } from "@squide/module-federation";
import { useEffect, useSyncExternalStore } from "react";

function subscribeToLocalModuleRegistrationStatusChanged(callback: () => void) {
    addLocalModuleRegistrationStatusChangedListener(callback);

    return () => removeLocalModuleRegistrationStatusChangedListener(callback);
}

function subscribeToRemoteModuleRegistrationStatusChanged(callback: () => void) {
    addRemoteModuleRegistrationStatusChangedListener(callback);

    return () => removeRemoteModuleRegistrationStatusChangedListener(callback);
}

export function useStrictRegistrationMode() {
    const runtime = useRuntime();

    const localModuleStatus = useSyncExternalStore(subscribeToLocalModuleRegistrationStatusChanged, getLocalModuleRegistrationStatus);
    const remoteModuleStatus = useSyncExternalStore(subscribeToRemoteModuleRegistrationStatusChanged, getRemoteModuleRegistrationStatus);

    useEffect(() => {
        if (areModulesReady(localModuleStatus, remoteModuleStatus)) {
            runtime._validateRegistrations();
        }
    }, [runtime, localModuleStatus, remoteModuleStatus]);
}
