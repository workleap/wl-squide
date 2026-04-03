import { useCallback } from "react";
import { useEventBus } from "../runtime/useEventBus.ts";
import type { EventBusDispatchFunction, EventMap, EventMapKey } from "./EventBus.ts";

export function useEventBusDispatcher() {
    const eventBus = useEventBus();

    return useCallback((eventName: EventMapKey, payload?: EventMap[EventMapKey]) => {
        eventBus.dispatch(eventName, payload);
    }, [eventBus]) as EventBusDispatchFunction;
}
