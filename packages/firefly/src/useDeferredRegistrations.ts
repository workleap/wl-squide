import { useRuntime, type ModuleRegistrationError } from "@squide/core";
import { useEffect } from "react";
import { useCanRegisterDeferredRegistrations } from "./useCanRegisterDeferredRegistrations.ts";
import { useCanUpdateDeferredRegistrations } from "./useCanUpdateDeferredRegistrations.ts";
import { useCommittedRef } from "./useComittedRef.ts";
import { useRegisterDeferredRegistrations } from "./useRegisterDeferredRegistrations.ts";
import { useUpdateDeferredRegistrations } from "./useUpdateDeferredRegistrations.ts";

export type DeferredRegistrationsErrorCallback = (errors: ModuleRegistrationError[]) => void;

export interface UseDeferredRegistrationsOptions {
    onError?: DeferredRegistrationsErrorCallback;
}

/*

- I think I would have to remember the last provided data OBJECT

- And use a SyncExternalStore to trigger a re-render when  the feature flags changes

- BUT FIRST, integrate the rest with the React Hooks and everything

*/

export function useDeferredRegistrations(data: unknown, { onError }: UseDeferredRegistrationsOptions = {}) {
    const runtime = useRuntime();

    // // Saving the last known data object because we now also re-execute the deferred registrations
    // // when the feature flags
    // const currentDataRef = useCommittedRef(data);

    const canRegisterDeferredRegistrations = useCanRegisterDeferredRegistrations();
    const canUpdateDeferredRegistrations = useCanUpdateDeferredRegistrations();

    const registerDeferredRegistrations = useRegisterDeferredRegistrations();
    const updateDeferredRegistrations = useUpdateDeferredRegistrations();

    useEffect(() => {
        if (canRegisterDeferredRegistrations) {
            const register = async () => {
                const errors = await registerDeferredRegistrations(data, runtime);

                if (errors.length > 0 && onError) {
                    onError(errors);
                }
            };

            register();
        }
    }, [canRegisterDeferredRegistrations, registerDeferredRegistrations, data, onError, runtime]);

    useEffect(() => {
        if (canUpdateDeferredRegistrations) {
            const update = async () => {
                const errors = await updateDeferredRegistrations(data, runtime);

                if (errors.length > 0 && onError) {
                    onError(errors);
                }
            };

            update();
        }
    }, [canUpdateDeferredRegistrations, updateDeferredRegistrations, data, onError, runtime]);

    /*

    - areModulesReady - YES
    - feature flags changed

    */
}
