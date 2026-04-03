import { useCallback } from "react";
import { useEventBus } from "../runtime/useEventBus.ts";
import type { EventBusDispatchFunction, EventName } from "./EventBus.ts";

export function useEventBusDispatcher() {
    const eventBus = useEventBus();

    return useCallback((eventName: EventName, payload?: unknown) => {
        eventBus.dispatch(eventName, payload);
    }, [eventBus]) as EventBusDispatchFunction;
}
