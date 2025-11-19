import { useRuntime } from "@squide/core";
import type { ReactRouterRuntime } from "./reactRouterRuntime2.ts";

export function useRoutes() {
    const runtime = useRuntime() as ReactRouterRuntime;

    return runtime.routes;
}
