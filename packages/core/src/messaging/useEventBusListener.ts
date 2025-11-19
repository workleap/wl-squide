import { useEffect } from "react";
import { useEventBus } from "../runtime/useEventBus.ts";
import type { AddListenerOptions, EventCallbackFunction, EventName } from "./EventBus.ts";

export function useEventBusListener<TEventNames extends EventName = EventName, TPayload = unknown>(eventName: TEventNames, callback: EventCallbackFunction<TPayload>, { once }: AddListenerOptions = {}) {
    const eventBus = useEventBus<TEventNames, TPayload>();

    return useEffect(() => {
        eventBus.addListener(eventName, callback, { once });

        return () => {
            eventBus.removeListener(eventName, callback, { once });
        };
    }, [eventName, callback, once]);
}
