import { updateLocalModuleDeferredRegistrations, type Runtime } from "@squide/core";
import { updateRemoteModuleDeferredRegistrations } from "./registerRemoteModules.ts";

export const DeferredRegistrationsUpdateStartedEvent = "squide-deferred-registrations-update-started";
export const DeferredRegistrationsUpdateCompletedEvent = "squide-deferred-registrations-update-completed-started";

export async function updateDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
    runtime.startDeferredRegistrationScope({
        transactional: true
    });

    try {
        runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

        const localModuleErrors = await updateLocalModuleDeferredRegistrations(data, runtime);
        const remoteModuleErrors = await updateRemoteModuleDeferredRegistrations(data, runtime);

        runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

        return {
            localModuleErrors,
            remoteModuleErrors
        };
    } finally {
        runtime.completeDeferredRegistrationScope();
    }
}
