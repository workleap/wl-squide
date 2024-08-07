import { addLocalModuleRegistrationStatusChangedListener, getLocalModuleRegistrationStatus, removeLocalModuleRegistrationStatusChangedListener } from "@squide/core";
import { useMemo, useSyncExternalStore } from "react";
import { areModulesReady } from "./areModulesReady.ts";
import { addRemoteModuleRegistrationStatusChangedListener, getRemoteModuleRegistrationStatus, removeRemoteModuleRegistrationStatusChangedListener } from "./registerRemoteModules.ts";

function subscribeToLocalModuleRegistrationStatusChanged(callback: () => void) {
    addLocalModuleRegistrationStatusChangedListener(callback);

    return () => removeLocalModuleRegistrationStatusChangedListener(callback);
}

function subscribeToRemoteModuleRegistrationStatusChanged(callback: () => void) {
    addRemoteModuleRegistrationStatusChangedListener(callback);

    return () => removeRemoteModuleRegistrationStatusChangedListener(callback);
}

export function useAreModulesReady() {
    const localModuleStatus = useSyncExternalStore(subscribeToLocalModuleRegistrationStatusChanged, getLocalModuleRegistrationStatus);
    const remoteModuleStatus = useSyncExternalStore(subscribeToRemoteModuleRegistrationStatusChanged, getRemoteModuleRegistrationStatus);

    return useMemo(() => areModulesReady(localModuleStatus, remoteModuleStatus), [localModuleStatus, remoteModuleStatus]);
}
