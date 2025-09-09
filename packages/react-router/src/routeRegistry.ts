import type { IndexRouteObject, NonIndexRouteObject } from "react-router";
import { ProtectedRoutes, ProtectedRoutesOutletId, PublicRoutes, PublicRoutesOutletId, isProtectedRoutesOutletRoute, isPublicRoutesOutletRoute } from "./outlets.ts";

/*

REMEMBER:

- In React Router, an "index" route cannot have children.
- In React Router, routes with a path starting with a "/", are considered as absolute (their parent paths will not automatically be prepended).
- In React Router, routes with a part not starting with a "/", are considere as relative to their parents.

*/

export type RouteVisibility = "public" | "protected";

export interface IndexRoute extends IndexRouteObject {
    $id?: string;
    $visibility?: RouteVisibility;
    $parentIndexPath?: string;
}

export interface NonIndexRoute extends Omit<NonIndexRouteObject, "children"> {
    $id?: string;
    $visibility?: RouteVisibility;
    $parentIndexPath?: string;
    children?: Route[];
}

export type Route = IndexRoute | NonIndexRoute;

export interface AddRouteOptions {
    hoist?: true;
    parentPath?: string;
    parentId?: string;
}

export type RouteRegistrationStatus = "pending" | "registered";

export interface RouteRegistrationResult {
    registrationStatus: RouteRegistrationStatus;
    completedPendingRegistrations: Route[];
    parentId?: string;
}

function isAbsoluteRoute(route: Route) {
    // Strangely, with React Router an absolute route path starts with a "/".
    return route && route.path && route.path.startsWith("/");
}

function appendPath(parentPath: string, childPath: string) {
    if (parentPath === "/") {
        return childPath;
    }

    const normalizedParentPath = parentPath.endsWith("/")
        ? parentPath.slice(0, -1)
        : parentPath;

    const normalizedChildPath = childPath.startsWith("/")
        ? childPath.slice(1)
        : childPath;

    return `${normalizedParentPath}/${normalizedChildPath}`;
}

function normalizePath(routePath: string) {
    let normalizedPath = routePath;

    if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
        normalizedPath = normalizedPath.slice(0, -1);
    }

    // Only work with "absolute" paths internally.
    if (!normalizedPath.startsWith("/")) {
        normalizedPath = `/${normalizedPath}`;
    }

    return normalizedPath;
}

export function createIndexKeys(route: Route, parentIndexPath?: string) {
    const keys: string[] = [];

    if (route.path) {
        const key = isAbsoluteRoute(route)
            ? route.path
            : parentIndexPath ? appendPath(parentIndexPath, route.path) : route.path;

        keys.push(normalizePath(key));
    }

    if (route.$id) {
        keys.push(route.$id);
    }

    return keys;
}

function resolveParentIndexPath(route: Route, parentIndexPath?: string) {
    if (!isAbsoluteRoute(route)) {
        if (parentIndexPath && route.path) {
            return appendPath(parentIndexPath, route.path);
        } else if (parentIndexPath) {
            return parentIndexPath;
        }
    }

    return route.path;
}

export class RouteRegistry {
    #routes: Route[] = [];

    // An index to speed up the look up of parent routes.
    // <indexKey, Route>
    readonly #routesIndex: Map<string, Route> = new Map();

    // An index of pending routes to register once their parent is registered.
    // <parentPath | parentId, Route[]>
    readonly #pendingRegistrationsIndex: Map<string, Route[]> = new Map();

    #addIndex(route: Route, parentIndexPath?: string) {
        const keys = createIndexKeys(route, parentIndexPath);

        keys.forEach(x => {
            if (this.#routesIndex.has(x)) {
                throw new Error(`[squide] A route index has already been registered for the key: "${x}". Did you register two routes with the same "path", or "$id" option or a route with the value for the "path" and "$id" option?`);
            }

            this.#routesIndex.set(x, route);
        });

        return keys;
    }

    #recursivelyAddRoutes(routes: Route[], parentIndexPath?: string) {
        const newRoutes: Route[] = [];
        const completedPendingRegistrations: Route[] = [];

        routes.forEach((x: Route) => {
            // Creates a copy of the route object and add the default properties.
            const route = {
                ...x,
                $visibility: x.$visibility ?? "protected",
                $parentIndexPath: parentIndexPath
            } satisfies Route;

            if (route.children) {
                // Recursively go through the children.
                const result = this.#recursivelyAddRoutes(
                    route.children,
                    resolveParentIndexPath(route, parentIndexPath)
                );

                route.children = result.newRoutes;
                completedPendingRegistrations.push(...result.completedPendingRegistrations);
            }

            // Add index entries to speed up the registration of future nested routes.
            const indexKeys = this.#addIndex(route, parentIndexPath);

            // IMPORTANT: do not handle the pending registrations before recursively going through the children.
            // Otherwise pending routes will be handled twice (one time as a pending registration and one time as child
            // of the route).
            if (indexKeys.length > 0) {
                const result = this.#tryRegisterPendingRoutes(indexKeys);
                completedPendingRegistrations.unshift(...result);
            }

            newRoutes.push(route);
        });

        return {
            newRoutes,
            completedPendingRegistrations
        };
    }

    #tryRegisterPendingRoutes(parentIds: string[]) {
        const completedPendingRegistrations: Route[] = [];

        parentIds.forEach(x => {
            const pendingRegistrations = this.#pendingRegistrationsIndex.get(x);

            if (pendingRegistrations) {
                completedPendingRegistrations.push(...pendingRegistrations);

                // Register the pending routes.
                const result = this.#addNestedRoutes(pendingRegistrations, x);
                completedPendingRegistrations.push(...result.completedPendingRegistrations);

                // Delete the pending registrations.
                this.#pendingRegistrationsIndex.delete(x);
            }
        });

        return completedPendingRegistrations;
    }

    #validateRouteRegistrationOptions(route: Route, { hoist, parentPath, parentId }: AddRouteOptions = {}) {
        if (hoist && parentPath) {
            throw new Error(`[squide] A route cannot have the "hoist" option when a "publicPath" option is provided. Route id: "${route.path ?? route.$id ?? "(no identifier)"}".`);
        }

        if (hoist && parentId) {
            throw new Error(`[squide] A route cannot have the "hoist" option when a "parentId" option is provided. Route id: "${route.path ?? route.$id ?? "(no identifier)"}".`);
        }
    }

    add(route: Route, options: AddRouteOptions = {}) {
        let parentId = options.parentId;

        // By default, a route that is not hoisted nor nested under a known
        // parent will be rendered under the PublicRoutes or ProtectedRoutes outlet depending on the route visibility..
        if (!options.hoist && !parentId && !isPublicRoutesOutletRoute(route) && !isProtectedRoutesOutletRoute(route)) {
            parentId = route.$visibility === "public" ? PublicRoutesOutletId : ProtectedRoutesOutletId;
        }

        this.#validateRouteRegistrationOptions(route, options);

        return this.#addRoute(route, {
            ...options,
            parentId
        });
    }

    #addRoute(route: Route, { parentPath, parentId }: AddRouteOptions) {
        if (parentPath) {
            // The normalized path cannot be undefined because it's been provided by the consumer
            // (e.g. it cannot be a pathless route).
            return this.#addNestedRoutes([route], normalizePath(parentPath)!);
        }

        if (parentId) {
            return this.#addNestedRoutes([route], parentId);
        }

        return this.#addRootRoute(route);
    }

    #addRootRoute(route: Route): RouteRegistrationResult {
        const { newRoutes, completedPendingRegistrations } = this.#recursivelyAddRoutes([route]);

        // Create a new array so the routes array is immutable.
        this.#routes = [...this.#routes, ...newRoutes];

        return {
            registrationStatus: "registered",
            completedPendingRegistrations
        };
    }

    #addNestedRoutes(routes: Route[], parentId: string): RouteRegistrationResult {
        const parentRoute = this.#routesIndex.get(parentId);

        if (!parentRoute) {
            const pendingRegistration = this.#pendingRegistrationsIndex.get(parentId);

            if (pendingRegistration) {
                pendingRegistration.push(...routes);
            } else {
                this.#pendingRegistrationsIndex.set(parentId, [...routes]);
            }

            return {
                registrationStatus: "pending",
                completedPendingRegistrations: [],
                parentId
            };
        }

        const { newRoutes, completedPendingRegistrations } = this.#recursivelyAddRoutes(
            routes,
            resolveParentIndexPath(parentRoute, parentRoute.$parentIndexPath)
        );

        // Register new nested routes as children of their parent route.
        parentRoute.children = [
            ...(parentRoute.children ?? []),
            ...newRoutes
        ];

        // Create a new array since the routes array is immutable and a nested
        // object has been updated.
        this.#routes = [...this.#routes];

        return {
            registrationStatus: "registered",
            completedPendingRegistrations,
            parentId
        };
    }

    get routes() {
        return this.#routes;
    }

    getPendingRegistrations() {
        return new PendingRouteRegistrations(this.#pendingRegistrationsIndex);
    }
}

export class PendingRouteRegistrations {
    readonly #pendingRegistrationsIndex: Map<string, Route[]> = new Map();

    constructor(pendingRegistrationsIndex: Map<string, Route[]> = new Map()) {
        this.#pendingRegistrationsIndex = pendingRegistrationsIndex;
    }

    getPendingRouteIds() {
        return Array.from(this.#pendingRegistrationsIndex.keys());
    }

    getPendingRegistrationsForRoute(parentId: string) {
        return this.#pendingRegistrationsIndex.get(parentId) ?? [];
    }

    isPublicRoutesOutletPending() {
        return this.#pendingRegistrationsIndex.has(PublicRoutes.$id!);
    }

    isProtectedRoutesOutletPending() {
        return this.#pendingRegistrationsIndex.has(ProtectedRoutes.$id!);
    }
}
