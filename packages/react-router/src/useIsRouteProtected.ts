import type { Route } from "./routeRegistry2.ts";

export function useIsRouteProtected(route?: Route) {
    if (!route) {
        return true;
    }

    return route.$visibility === "protected";
}
