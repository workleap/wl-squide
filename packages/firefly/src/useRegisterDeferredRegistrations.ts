import { useRuntime } from "@squide/core";
import { useCallback } from "react";

export function useRegisterDeferredRegistrations() {
    const runtime = useRuntime();

    return useCallback(<TData = unknown>(data?: TData) => {
        return runtime.moduleManager.registerDeferredRegistrations(data);
    }, [runtime]);
}
