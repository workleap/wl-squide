import { useCallback } from "react";
import { useEventBus } from "../runtime/useEventBus.ts";
import type { EventName } from "./eventBus2.ts";

export function useEventBusDispatcher<TEventNames extends EventName, TPayload = unknown>() {
    const eventBus = useEventBus<TEventNames, TPayload>();

    return useCallback((eventName: TEventNames, payload?: TPayload) => {
        eventBus.dispatch(eventName, payload);
    }, [eventBus]);
}
