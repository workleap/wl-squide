import { useCallback } from "react";
import { useApplicationEventBusDispatcher, useApplicationEventBusListener } from "./eventBus.ts";

export function useToast() {
    const dispatch = useApplicationEventBusDispatcher();

    return useCallback((message: string) => {
        dispatch("show-toast", message);
    }, [dispatch]);
}

export function useToastListener(callback: (message?: string) => void) {
    useApplicationEventBusListener("show-toast", callback);
}
