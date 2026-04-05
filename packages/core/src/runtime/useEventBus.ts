import { useRuntime } from "./RuntimeContext.ts";

export function useEventBus() {
    const runtime = useRuntime();

    return runtime.eventBus;
}
