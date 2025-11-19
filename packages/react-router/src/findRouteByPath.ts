import type { Route } from "./RouteRegistry.ts";

export function findRouteByPath(routes: Route[], path: string): Route | undefined {
    for (const route of routes.values()) {
        if (route.path === path) {
            return route;
        }

        if (route.children) {
            const childRoute = findRouteByPath(route?.children, path);

            if (childRoute) {
                return childRoute;
            }
        }
    }

    return undefined;
}
