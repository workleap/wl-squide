import { useEffect } from "react";
import { useEventBus } from "../runtime/useEventBus.ts";
import type { AddListenerOptions, EventCallbackFunction, EventMap, EventMapKey, EventName } from "./EventBus.ts";

export function useEventBusListener<K extends EventMapKey>(eventName: K, callback: EventCallbackFunction<EventMap[K]>, options?: AddListenerOptions): void;
export function useEventBusListener(eventName: EventName, callback: EventCallbackFunction, options?: AddListenerOptions): void;
export function useEventBusListener(eventName: EventName, callback: EventCallbackFunction, { once }: AddListenerOptions = {}) {
    const eventBus = useEventBus();

    return useEffect(() => {
        eventBus.addListener(eventName, callback, { once });

        return () => {
            eventBus.removeListener(eventName, callback, { once });
        };
    }, [eventName, callback, once]);
}
