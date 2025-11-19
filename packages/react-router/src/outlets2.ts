import type { NonIndexRoute, Route } from "./routeRegistry2.ts";

export const PublicRoutesOutletId = "__squide-public-routes-outlet__";

export const PublicRoutes: NonIndexRoute = {
    $visibility: "public",
    $id: PublicRoutesOutletId
};

export function isPublicRoutesOutletRoute(route: Route) {
    return route.$id === PublicRoutesOutletId;
}

export const ProtectedRoutesOutletId = "__squide-protected-routes-outlet__";

export const ProtectedRoutes: NonIndexRoute = {
    $visibility: "protected",
    $id: ProtectedRoutesOutletId
};

export function isProtectedRoutesOutletRoute(route: Route) {
    return route.$id === ProtectedRoutesOutletId;
}
