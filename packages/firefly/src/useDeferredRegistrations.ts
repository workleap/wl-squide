import { useRuntime, type ModuleRegistrationError } from "@squide/core";
import { useFeatureFlags } from "@squide/launch-darkly";
import { useEffect } from "react";
import { useCanRegisterDeferredRegistrations } from "./useCanRegisterDeferredRegistrations.ts";
import { useCanUpdateDeferredRegistrations } from "./useCanUpdateDeferredRegistrations.ts";
import { useRegisterDeferredRegistrations } from "./useRegisterDeferredRegistrations.ts";
import { useUpdateDeferredRegistrations } from "./useUpdateDeferredRegistrations.ts";

export type DeferredRegistrationsErrorCallback = (errors: ModuleRegistrationError[]) => void;

export interface UseDeferredRegistrationsOptions {
    onError?: DeferredRegistrationsErrorCallback;
}

export function useDeferredRegistrations(data: unknown, { onError }: UseDeferredRegistrationsOptions = {}) {
    const runtime = useRuntime();

    // Using the feature flags to force a re-render when the feature flags change.
    const featureFlags = useFeatureFlags();

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
    // IMPORTANT: Added the featureFlags to trigger a deferred registrations update if they changed.
    }, [canUpdateDeferredRegistrations, updateDeferredRegistrations, data, featureFlags, onError, runtime]);
}
