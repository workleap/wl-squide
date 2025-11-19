import type { EventBus, EventName } from "../messaging/EventBus.ts";

import { useRuntime } from "./RuntimeContext.ts";

export function useEventBus<TEventNames extends EventName, TPayload = unknown>() {
    const runtime = useRuntime();

    return runtime.eventBus as unknown as EventBus<TEventNames, TPayload>;
}
