import { useRuntime } from "@squide/core";
import { useCallback } from "react";
import { useAppRouterDispatcher } from "./AppRouterContext.ts";

export const DeferredRegistrationsUpdateStartedEvent = "squide-deferred-registrations-update-started";
export const DeferredRegistrationsUpdateCompletedEvent = "squide-deferred-registrations-update-completed-started";

export function useUpdateDeferredRegistrations() {
    const runtime = useRuntime();
    const dispatch = useAppRouterDispatcher();

    return useCallback(async <TData = unknown>(data?: TData) => {
        runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

        const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

        dispatch({ type: "deferred-registrations-updated" });

        runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

        return errors;
    }, [runtime, dispatch]);
}
