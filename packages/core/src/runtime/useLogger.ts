import { useRuntime } from "./RuntimeContext.ts";

export function useLogger() {
    const runtime = useRuntime();

    return runtime.logger;
}
