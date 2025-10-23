import type { ModuleRegistrationStatus } from "@squide/core";

export function areModulesRegistered(localModuleRegistrationStatus: ModuleRegistrationStatus, remoteModuleRegistrationStatus: ModuleRegistrationStatus) {
    if (localModuleRegistrationStatus === "none" && remoteModuleRegistrationStatus === "none") {
        return false;
    }

    // The registration for local or remote modules could be "none" if an application doesn't register either local or remote modules.
    // The registration for local or remote modules could be "registering-deferred-registration" if all the modules of an application are registered and it's registering the deferred registrations (which is considered as being already registered).
    // The registration statuses could be at "ready" if there's no deferred registrations.
    return (localModuleRegistrationStatus === "none" || localModuleRegistrationStatus === "modules-registered" || localModuleRegistrationStatus === "registering-deferred-registration" || localModuleRegistrationStatus === "ready") &&
        (remoteModuleRegistrationStatus === "none" || remoteModuleRegistrationStatus === "modules-registered" || remoteModuleRegistrationStatus === "registering-deferred-registration" || remoteModuleRegistrationStatus === "ready");
}
