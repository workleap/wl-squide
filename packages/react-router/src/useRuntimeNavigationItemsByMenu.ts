import { useRuntime } from "@squide/core";
import type { ReactRouterRuntime } from "./ReactRouterRuntime.ts";

export function useRuntimeNavigationItemsByMenu() {
    const runtime = useRuntime() as ReactRouterRuntime;

    return runtime.getNavigationItemsByMenu();
}
