import { useRuntime } from "@squide/core";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";

export function useAppRouterStore() {
    const runtime = useRuntime() as FireflyRuntime;

    return runtime.appRouterStore;
}
