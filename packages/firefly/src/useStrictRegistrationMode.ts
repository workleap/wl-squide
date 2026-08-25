import { useEventBusListener, useRuntime } from "@squide/core";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { DeferredRegistrationsUpdateCompletedEvent } from "./useUpdateDeferredRegistrations.ts";

export interface UseStrictRegistrationModeOptions {
    isEnabled?: boolean;
}

export function useStrictRegistrationMode(options: UseStrictRegistrationModeOptions = {}) {
    const {
        isEnabled = true
    } = options;

    const runtime = useRuntime();

    const subscribe = useCallback((callback: () => void) => {
        runtime.moduleManager.registerModulesReadyListener(callback);

        return () => {
            runtime.moduleManager.removeModulesReadyListener(callback);
        };
    }, [runtime]);

    // This listener is only executed if the modules are ready.
    const areModulesReady = useSyncExternalStore(subscribe, () => runtime.moduleManager.getAreModulesReady());

    useEffect(() => {
        if (areModulesReady && isEnabled) {
            runtime._validateRegistrations();
        }
    }, [runtime, areModulesReady, isEnabled]);

    const [completedUpdateCount, setCompletedUpdateCount] = useState(0);

    const handleDeferredRegistrationsUpdateCompleted = useCallback(() => {
        setCompletedUpdateCount(x => x + 1);
    }, []);

    useEventBusListener(DeferredRegistrationsUpdateCompletedEvent, handleDeferredRegistrationsUpdateCompleted);

    useEffect(() => {
        // Validating from an effect rather than from the event bus listener above. The completed event is
        // dispatched from within the async update callback, so throwing from the listener would surface as an
        // unhandled rejection rather than as a React error. Routes are frozen after the first registration
        // phase (ADR-0001), only the navigation items can become pending during an update run.
        if (completedUpdateCount > 0 && isEnabled) {
            runtime._validateRegistrations({ includeRoutes: false });
        }
    }, [runtime, completedUpdateCount, isEnabled]);
}
