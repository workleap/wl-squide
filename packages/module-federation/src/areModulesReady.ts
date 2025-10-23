import type { ModuleRegistrationStatus } from "@squide/core";

export function areModulesReady(localModuleRegistrationStatus: ModuleRegistrationStatus, remoteModuleRegistrationStatus: ModuleRegistrationStatus) {
    if (localModuleRegistrationStatus === "none" && remoteModuleRegistrationStatus === "none") {
        return false;
    }

    // The registration for local or remote modules could be "none" if an application doesn't register either local or remote modules.
    return (localModuleRegistrationStatus === "none" || localModuleRegistrationStatus === "ready") &&
        (remoteModuleRegistrationStatus === "none" || remoteModuleRegistrationStatus === "ready");
}
