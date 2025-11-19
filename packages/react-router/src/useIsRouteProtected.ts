import type { Route } from "./RouteRegistry.ts";

export function useIsRouteProtected(route?: Route) {
    if (!route) {
        return true;
    }

    return route.$visibility === "protected";
}
