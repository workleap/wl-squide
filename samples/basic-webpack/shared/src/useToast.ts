import { useEventBusDispatcher, useEventBusListener } from "@squide/firefly";
import { useCallback } from "react";

export function useToast() {
    const dispatch = useEventBusDispatcher();

    return useCallback((message: string) => {
        dispatch("show-toast", message);
    }, [dispatch]);
}

export function useToastListener(callback: (message?: string) => void) {
    useEventBusListener("show-toast", callback);
}
