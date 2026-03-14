import { useRuntime, type ModuleRegistrationError } from "@squide/core";
import { useEffect, useRef } from "react";
import { FireflyRuntime } from "./FireflyRuntime.tsx";
import { useCanRegisterDeferredRegistrations } from "./useCanRegisterDeferredRegistrations.ts";
import { useCanUpdateDeferredRegistrations } from "./useCanUpdateDeferredRegistrations.ts";
import { useRegisterDeferredRegistrations } from "./useRegisterDeferredRegistrations.ts";
import { useUpdateDeferredRegistrations } from "./useUpdateDeferredRegistrations.ts";

export type DeferredRegistrationsErrorCallback = (errors: ModuleRegistrationError[]) => void;

export interface UseDeferredRegistrationsOptions {
    onError?: DeferredRegistrationsErrorCallback;
}

export function useDeferredRegistrations(data?: unknown, { onError }: UseDeferredRegistrationsOptions = {}) {
    const runtime = useRuntime() as FireflyRuntime;
    // const isExecutedBecauseModulesAreNowReadyRef = useRef(true);

    const canRegisterDeferredRegistrations = useCanRegisterDeferredRegistrations();
    const canUpdateDeferredRegistrations = useCanUpdateDeferredRegistrations();

    const registerDeferredRegistrations = useRegisterDeferredRegistrations();
    const updateDeferredRegistrations = useUpdateDeferredRegistrations();

    useEffect(() => {
        if (canRegisterDeferredRegistrations) {
            const register = async () => {
                const errors = await registerDeferredRegistrations(data);

                if (errors.length > 0 && onError) {
                    onError(errors);
                }
            };

            register();
        }
    }, [canRegisterDeferredRegistrations, registerDeferredRegistrations, data, onError]);

    const isInitialUpdateDeferredRegistrationsExecution = useRef(true);

    useEffect(() => {
        if (canUpdateDeferredRegistrations) {
            // HACK: Skipping the first execution successfully passing the gate because this is due to
            // the modules being ready, and it's most certainly the same data that has been forwarded earlier to the deferred registration.
            // Ideally, instead of this hacky ref, it would be a ref tracking the previous data object, and the deferred registration would
            // only be updated if the current data object != than the previous data object. Sadly, it is not possible because
            // of the feature flags.
            if (isInitialUpdateDeferredRegistrationsExecution.current) {
                isInitialUpdateDeferredRegistrationsExecution.current = false;
                return;
            }

            const update = async () => {
                const errors = await updateDeferredRegistrations(data);

                if (errors.length > 0 && onError) {
                    onError(errors);
                }
            };

            update();
        }
    }, [
        canUpdateDeferredRegistrations,
        updateDeferredRegistrations,
        data,
        onError,
        // Trigger this closure when the feature flags changed. Using the timestamp because the
        // actual feature flags are not forwarded to the deferred registrations.
        runtime.appRouterStore.state.featureFlagsUpdatedAt
    ]);
}
