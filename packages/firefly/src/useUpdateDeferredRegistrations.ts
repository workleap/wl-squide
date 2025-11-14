import type { Runtime } from "@squide/core";
// import { updateDeferredRegistrations } from "@squide/module-federation";
import { useCallback } from "react";
import { useAppRouterDispatcher } from "./AppRouterContext.ts";

export const DeferredRegistrationsUpdateStartedEvent = "squide-deferred-registrations-update-started";
export const DeferredRegistrationsUpdateCompletedEvent = "squide-deferred-registrations-update-completed-started";

export function useUpdateDeferredRegistrations() {
    const dispatch = useAppRouterDispatcher();

    return useCallback(async <TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) => {
        // const errors = await updateDeferredRegistrations(data, runtime);

        runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

        const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

        dispatch({ type: "deferred-registrations-updated" });

        runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

        return errors;
    }, [dispatch]);
}
