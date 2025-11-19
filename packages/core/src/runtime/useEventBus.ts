import type { EventBus, EventName } from "../messaging/eventBus2.ts";

import { useRuntime } from "./RuntimeContext.ts";

export function useEventBus<TEventNames extends EventName, TPayload = unknown>() {
    const runtime = useRuntime();

    return runtime.eventBus as unknown as EventBus<TEventNames, TPayload>;
}
