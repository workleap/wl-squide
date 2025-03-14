import { RootMenuId, Runtime, type RegisterNavigationItemOptions, type RegisterRouteOptions } from "@squide/core";
import { NavigationItemDeferredRegistrationScope, NavigationItemDeferredRegistrationTransactionalScope, NavigationItemRegistry, parseSectionIndexKey, type NavigationItemRegistrationResult, type RootNavigationItem } from "./navigationItemRegistry.ts";
import { ProtectedRoutesOutletId, PublicRoutesOutletId } from "./outlets.ts";
import { RouteRegistry, type Route } from "./routeRegistry.ts";

function indent(text: string, depth: number) {
    return `${" ".repeat(depth * 4)}${text}`;
}

function translateOutletsParentId(parentId?: string) {
    if (parentId === PublicRoutesOutletId) {
        return "PublicRoutes";
    }

    if (parentId === ProtectedRoutesOutletId) {
        return "ProtectedRoutes";
    }

    return parentId;
}

function logRoutesTree(routes: Route[], depth: number = 0) {
    let log = "";

    routes.forEach(x => {
        log += indent(`- ${x.path ?? x.$id ?? (x.index ? "(index route)" : undefined) ?? "(no identifier)"}\r\n`, depth);

        if (x.children) {
            log += logRoutesTree(x.children, depth + 1);
        }
    });

    return log;
}

export class ReactRouterRuntime extends Runtime<Route, RootNavigationItem> {
    readonly #routeRegistry = new RouteRegistry();
    readonly #navigationItemRegistry = new NavigationItemRegistry();
    #navigationItemScope?: NavigationItemDeferredRegistrationScope;

    startDeferredRegistrationScope(transactional: boolean = false) {
        if (this.#navigationItemScope) {
            throw new Error("[squide] Cannot start a new deferred registration scope when there's already an active scope. Did you forget to complete the previous scope?");
        }

        if (transactional) {
            this.#navigationItemScope = new NavigationItemDeferredRegistrationTransactionalScope(this.#navigationItemRegistry);
        } else {
            this.#navigationItemScope = new NavigationItemDeferredRegistrationScope(this.#navigationItemRegistry);
        }
    }

    completeDeferredRegistrationScope() {
        if (!this.#navigationItemScope) {
            throw new Error("[squide] A deferred registration scope must be started before calling the complete function. Did you forget to start the scope?");
        }

        if (this.#navigationItemScope) {
            this.#navigationItemScope.complete();
            this.#navigationItemScope = undefined;
        }
    }

    registerRoute(route: Route, options: RegisterRouteOptions = {}) {
        const result = this.#routeRegistry.add(route, options);

        const parentId = translateOutletsParentId(result.parentId);

        if (result.registrationStatus === "registered") {
            const parentLog = parentId ? ` as a children of the "${parentId}" route` : "";

            this._logger.debug(
                `[squide] The following route has been %cregistered%c${parentLog}.`, "color: white; background-color: green;", "%s",
                "Newly registered item:", route,
                "All registered routes:", this.#routeRegistry.routes
            );

            if (result.completedPendingRegistrations.length > 0) {
                this._logger.debug(
                    `[squide] The pending registration of the following route${result.completedPendingRegistrations.length !== 1 ? "s" : ""} has been %ccompleted%c.`, "color: white; background-color: green;", "%s",
                    "Newly registered routes:", result.completedPendingRegistrations,
                    "All registered routes:", this.#routeRegistry.routes
                );
            }
        } else {
            this._logger.debug(
                `[squide] The following route registration is %cpending%c until "${parentId}" is registered.`, "color: black; background-color: yellow;", "%s",
                "Pending registration:", route,
                "All registered routes:", this.#routeRegistry.routes
            );
        }
    }

    registerPublicRoute(route: Omit<Route, "$visibility">, options?: RegisterRouteOptions): void {
        this.registerRoute({
            $visibility: "public",
            ...route
        } as Route, options);
    }

    get routes() {
        return this.#routeRegistry.routes;
    }

    registerNavigationItem(navigationItem: RootNavigationItem, { menuId = RootMenuId, ...options }: RegisterNavigationItemOptions = {}) {
        if (this.#navigationItemScope) {
            const result = this.#navigationItemScope.addItem(menuId, navigationItem, options);
            const items = this.#navigationItemScope.getItems(menuId)!;

            this.#logNavigationItemRegistrationResult(result, items);
        } else {
            const result = this.#navigationItemRegistry.add(menuId, "static", navigationItem, options);
            const items = this.#navigationItemRegistry.getItems(menuId)!;

            this.#logNavigationItemRegistrationResult(result, items);
        }
    }

    #logNavigationItemRegistrationResult(result: NavigationItemRegistrationResult, registeredItems: RootNavigationItem[]) {
        const {
            registrationStatus,
            completedPendingRegistrations,
            registrationType,
            item: newItem,
            menuId,
            sectionId
        } = result;

        if (registrationStatus === "registered") {
            const sectionLog = sectionId ? `under the "${sectionId}" section of` : "to";

            this._logger.debug(
                `[squide] The following ${registrationType} navigation item has been %cregistered%c ${sectionLog} the "${menuId}" menu for a total of ${registeredItems.length} ${registrationType} item${registeredItems.length !== 1 ? "s" : ""}.`, "color: white; background-color: green;", "%s",
                "Newly registered item:", newItem,
                "All registered items:", registeredItems
            );

            if (completedPendingRegistrations.length > 0) {
                this._logger.debug(
                    `[squide] The pending registration of the following ${registrationType} navigation item${completedPendingRegistrations.length !== 1 ? "s" : ""} has been %ccompleted%c.`, "color: white; background-color: green;", "%s",
                    "Newly registered items:", completedPendingRegistrations,
                    "All registered items:", registeredItems
                );
            }
        } else {
            this._logger.debug(
                `[squide] The following ${registrationType} navigation item registration is %cpending%c until the "${sectionId}" section of the "${menuId}" menu is registered.`, "color: black; background-color: yellow;", "%s",
                "Pending registration:", newItem,
                "All registered items:", registeredItems
            );
        }
    }

    getNavigationItems(menuId: string = RootMenuId) {
        return this.#navigationItemRegistry.getItems(menuId);
    }

    _validateRegistrations() {
        this.#validateRouteRegistrations();
        this.#validateNavigationItemRegistrations();

        super._validateRegistrations();
    }

    #validateRouteRegistrations() {
        const pendingRegistrations = this.#routeRegistry.getPendingRegistrations();
        const pendingRoutes = pendingRegistrations.getPendingRouteIds();

        if (pendingRoutes.length > 0) {
            if (pendingRegistrations.isPublicRoutesOutletPending() && pendingRegistrations.isProtectedRoutesOutletPending()) {
                // eslint-disable-next-line max-len
                throw new Error("[squide] The PublicRoutes and ProtectedRoutes outlets are missing from the router configuration. The PublicRoutes and ProtectedRoutes outlets must be defined as a children of an hoisted route. Did you include the PublicRoutes and ProtectedRoutes outlets and hoist the outlets' parent routes?");
            } else if (pendingRegistrations.isPublicRoutesOutletPending()) {
                throw new Error("[squide] The PublicRoutes outlet is missing from the router configuration. The PublicRoutes outlet must be defined as a children of an hoisted route. Did you include the PublicRoutes outlet and hoist the outlet's parent routes");
            } else if (pendingRegistrations.isProtectedRoutesOutletPending()) {
                throw new Error("[squide] The ProtectedRoutes outlet is missing from the router configuration. The ProtectedRoutes outlet must be defined as a children of an hoisted route. Did you include the ProtectedRoutes outlet and hoist the outlet's parent routes");
            }

            let message = `[squide] ${pendingRoutes.length} route${pendingRoutes.length !== 1 ? "s were" : " is"} expected to be registered but ${pendingRoutes.length !== 1 ? "are" : "is"} missing:\r\n\r\n`;

            pendingRoutes.forEach((x, index) => {
                message += `${index + 1}/${pendingRoutes.length} Missing route with the following path or id: "${x}"\r\n`;
                message += indent("Pending registrations:\r\n", 1);

                const pendingRegistrationsForRoute = pendingRegistrations.getPendingRegistrationsForRoute(x);

                pendingRegistrationsForRoute.forEach(y => {
                    message += indent(`- "${y.path ?? y.$id ?? "(no identifier)"}"\r\n`, 2);
                });

                message += "\r\n";
            });

            message += "Registered routes:\r\n";
            message += logRoutesTree(this.#routeRegistry.routes, 1);
            message += "\r\n";

            message += `If you are certain that the route${pendingRoutes.length !== 1 ? "s" : ""} has been registered, make sure that the following conditions are met:\r\n`;
            message += "- The missing routes \"path\" or \"$id\" option perfectly match the provided \"parentPath\" or \"parentId\" (make sure that there's no leading or trailing \"/\" that differs).\r\n";
            message += "- The missing routes has been registered with the runtime.registerRoute function. A route cannot be registered under a parent route that has not be registered with the runtime.registerRoute function.\r\n\r\n";
            message += "For more information about nested routes, refers to https://workleap.github.io/wl-squide/reference/runtime/runtime-class/#register-nested-routes-under-an-existing-route.\r\n\r\n";
            message += "For more information about the PublicRoutes and ProtectedRoutes outlets, refers to https://workleap.github.io/wl-squide/reference/#routing.";

            if (this._mode === "development") {
                throw new Error(message);
            } else {
                this._logger.error(message);
            }
        }
    }

    #validateNavigationItemRegistrations() {
        const pendingRegistrations = this.#navigationItemRegistry.getPendingRegistrations();
        const pendingSectionIds = pendingRegistrations.getPendingSectionIds();

        if (pendingSectionIds.length > 0) {
            let message = `[squide] ${pendingSectionIds.length} navigation item${pendingSectionIds.length !== 1 ? "s were" : " is"} expected to be registered but ${pendingSectionIds.length !== 1 ? "are" : "is"} missing:\r\n\r\n`;

            pendingSectionIds.forEach((x, index) => {
                const [menuId, sectionId] = parseSectionIndexKey(x);

                message += `${index + 1}/${pendingSectionIds.length} Missing navigation section "${sectionId}" of the "${menuId}" menu.\r\n`;
                message += indent("Pending registrations:\r\n", 1);

                const pendingItems = pendingRegistrations.getPendingRegistrationsForSection(x);

                pendingItems.forEach(y => {
                    message += indent(`- "${y.item.$id ?? y.item.$label ?? y.item.to ?? "(no identifier)"}"\r\n`, 2);
                });

                message += "\r\n";
            });

            message += `If you are certain that the navigation section${pendingSectionIds.length !== 1 ? "s" : ""} has been registered, make sure that the following conditions are met:\r\n`;
            message += "- The missing navigation section \"$id\" and \"menuId\" properties perfectly match the provided \"sectionId\" and \"menuId\".\r\n\r\n";
            message += "For more information about nested navigation items, refers to: https://workleap.github.io/wl-squide/reference/runtime/runtime-class/#register-nested-navigation-items.\r\n";

            if (this._mode === "development") {
                throw new Error(message);
            } else {
                this._logger.error(message);
            }
        }
    }
}
