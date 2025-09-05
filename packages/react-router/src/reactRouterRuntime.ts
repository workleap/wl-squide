import { RootMenuId, Runtime, RuntimeScope, type GetNavigationItemsOptions, type IRuntime, type RegisterNavigationItemOptions, type RegisterRouteOptions, type StartDeferredRegistrationScopeOptions, type ValidateRegistrationsOptions } from "@squide/core";
import type { Logger } from "@workleap/logging";
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

// export interface ReactRouterRuntimeMembers extends RuntimeMembers {
//     routeRegistry: RouteRegistry;
//     navigationItemRegistry: NavigationItemRegistry;
//     navigationItemScope?: NavigationItemDeferredRegistrationScope;
// }

// const reactRouterRuntimeMembersKeys: (keyof ReactRouterRuntimeMembers)[] = [
//     "routeRegistry",
//     "navigationItemRegistry",
//     "navigationItemScope"
// ];

// export function isReactRouterRuntimeMembers(obj: unknown): obj is RuntimeMembers {
//     if (obj && typeof obj === "object") {
//         return isRuntimeMembers(obj) && reactRouterRuntimeMembersKeys.every(
//             x => x in obj
//         );
//     }

//     return false;
// }

// export class ReactRouterRuntime extends Runtime<Route, RootNavigationItem> {
//     protected _routeRegistry: RouteRegistry;
//     protected _navigationItemRegistry: NavigationItemRegistry;
//     protected _navigationItemScope?: NavigationItemDeferredRegistrationScope;

//     constructor(options?: RuntimeOptions);
//     constructor(members?: ReactRouterRuntimeMembers);

//     // TODO: There might be something akward with navigationItemScope since it's a member that instanciated
//     // and nullified. -> To test
//     constructor(obj?: RuntimeOptions | ReactRouterRuntimeMembers) {
//         if (isReactRouterRuntimeMembers(obj)) {
//             super(obj);

//             this._routeRegistry = obj.routeRegistry;
//             this._navigationItemRegistry = obj.navigationItemRegistry;
//             this._navigationItemScope = obj.navigationItemScope;
//         } else {
//             super(obj);

//             this._routeRegistry = new RouteRegistry();
//             this._navigationItemRegistry = new NavigationItemRegistry();
//         }
//     }

//     startDeferredRegistrationScope(transactional: boolean = false) {
//         if (this._navigationItemScope) {
//             throw new Error("[squide] Cannot start a new deferred registration scope when there's already an active scope. Did you forget to complete the previous scope?");
//         }

//         if (transactional) {
//             this._navigationItemScope = new NavigationItemDeferredRegistrationTransactionalScope(this._navigationItemRegistry);
//         } else {
//             this._navigationItemScope = new NavigationItemDeferredRegistrationScope(this._navigationItemRegistry);
//         }
//     }

//     completeDeferredRegistrationScope() {
//         if (!this._navigationItemScope) {
//             throw new Error("[squide] A deferred registration scope must be started before calling the complete function. Did you forget to start the scope?");
//         }

//         if (this._navigationItemScope) {
//             this._navigationItemScope.complete();
//             this._navigationItemScope = undefined;
//         }
//     }

//     registerRoute(route: Route, options: RegisterRouteOptions = {}) {
//         const result = this._routeRegistry.add(route, options);

//         const parentId = translateOutletsParentId(result.parentId);

//         if (result.registrationStatus === "registered") {
//             const parentLog = parentId ? `as a children of the "${parentId}" route` : "";

//             this._logger
//                 .withText("[squide] The following route has been")
//                 .withText("registered", {
//                     style: {
//                         color: "white",
//                         backgroundColor: "green"
//                     }
//                 })
//                 .withText(parentLog)
//                 .withText(".", {
//                     leadingSpace: false
//                 })
//                 .withLineChange()
//                 .withText("Newly registered item:")
//                 .withObject(route)
//                 .withLineChange()
//                 .withText("All registered routes:")
//                 .withObject(this._routeRegistry.routes)
//                 .debug();

//             if (result.completedPendingRegistrations.length > 0) {
//                 this._logger
//                     .withText(`[squide] The pending registration of the following route${result.completedPendingRegistrations.length !== 1 ? "s" : ""} has been`)
//                     .withText("completed", {
//                         style: {
//                             color: "white",
//                             backgroundColor: "green"
//                         }
//                     })
//                     .withText(".", {
//                         leadingSpace: false
//                     })
//                     .withLineChange()
//                     .withText("Newly registered routes:")
//                     .withObject(result.completedPendingRegistrations)
//                     .withLineChange()
//                     .withText("All registered routes:")
//                     .withObject(this._routeRegistry.routes)
//                     .debug();
//             }
//         } else {
//             this._logger
//                 .withText("[squide] The following route registration is")
//                 .withText("pending", {
//                     style: {
//                         color: "black",
//                         backgroundColor: "yellow"
//                     }
//                 })
//                 .withText(`until "${parentId}" is registered.`)
//                 .withLineChange()
//                 .withText("Pending registration:")
//                 .withObject(route)
//                 .withLineChange()
//                 .withText("All registered routes:")
//                 .withObject(this._routeRegistry.routes)
//                 .debug();
//         }
//     }

//     registerPublicRoute(route: Omit<Route, "$visibility">, options?: RegisterRouteOptions) {
//         this.registerRoute({
//             $visibility: "public",
//             ...route
//         } as Route, options);
//     }

//     get routes() {
//         return this._routeRegistry.routes;
//     }

//     registerNavigationItem(navigationItem: RootNavigationItem, { menuId = RootMenuId, ...options }: RegisterNavigationItemOptions = {}) {
//         if (this._navigationItemScope) {
//             const result = this._navigationItemScope.addItem(menuId, navigationItem, options);
//             const items = this._navigationItemScope.getItems(menuId)!;

//             this.#logNavigationItemRegistrationResult(result, items);
//         } else {
//             const result = this._navigationItemRegistry.add(menuId, "static", navigationItem, options);
//             const items = this._navigationItemRegistry.getItems(menuId)!;

//             this.#logNavigationItemRegistrationResult(result, items);
//         }
//     }

//     #logNavigationItemRegistrationResult(result: NavigationItemRegistrationResult, registeredItems: RootNavigationItem[]) {
//         const {
//             registrationStatus,
//             completedPendingRegistrations,
//             registrationType,
//             item: newItem,
//             menuId,
//             sectionId
//         } = result;

//         if (registrationStatus === "registered") {
//             const sectionLog = sectionId ? `under the "${sectionId}" section of` : "to";

//             this._logger
//                 .withText(`[squide] The following ${registrationType} navigation item has been`)
//                 .withText("registered", {
//                     style: {
//                         color: "white",
//                         backgroundColor: "green"
//                     }
//                 })
//                 .withText(`${sectionLog} the "${menuId}" menu for a total of ${registeredItems.length} ${registrationType} item${registeredItems.length !== 1 ? "s" : ""}.`)
//                 .withLineChange()
//                 .withText("Newly registered item:")
//                 .withObject(newItem)
//                 .withLineChange()
//                 .withText("All registered items:")
//                 .withObject(registeredItems)
//                 .debug();

//             if (completedPendingRegistrations.length > 0) {
//                 this._logger
//                     .withText(`[squide] The pending registration of the following ${registrationType} navigation item${completedPendingRegistrations.length !== 1 ? "s" : ""} has been`)
//                     .withText("completed", {
//                         style: {
//                             color: "white",
//                             backgroundColor: "green"
//                         }
//                     })
//                     .withText(".", {
//                         leadingSpace: false
//                     })
//                     .withLineChange()
//                     .withText("Newly registered items:")
//                     .withObject(completedPendingRegistrations)
//                     .withLineChange()
//                     .withText("All registered items:")
//                     .withObject(registeredItems)
//                     .debug();
//             }
//         } else {
//             this._logger
//                 .withText(`[squide] The following ${registrationType} navigation item registration is`)
//                 .withText("pending", {
//                     style: {
//                         color: "black",
//                         backgroundColor: "yellow"
//                     }
//                 })
//                 .withText(`until the "${sectionId}" section of the "${menuId}" menu is registered.`)
//                 .withLineChange()
//                 .withText("Pending registration:")
//                 .withObject(newItem)
//                 .withLineChange()
//                 .withText("All registered items:")
//                 .withObject(registeredItems)
//                 .debug();
//         }
//     }

//     getNavigationItems(menuId: string = RootMenuId) {
//         return this._navigationItemRegistry.getItems(menuId);
//     }

//     startScope(logger: Logger): ReactRouterRuntime {
//         return new ReactRouterRuntime({
//             mode: this._mode,
//             logger,
//             eventBus: this._eventBus,
//             plugins: this._plugins,
//             routeRegistry: this._routeRegistry,
//             navigationItemRegistry: this._navigationItemRegistry,
//             navigationItemScope: this._navigationItemScope
//         });
//     }

//     validateRegistrations() {
//         this.#validateRouteRegistrations();
//         this.#validateNavigationItemRegistrations();

//         super.validateRegistrations();
//     }

//     #validateRouteRegistrations() {
//         const pendingRegistrations = this._routeRegistry.getPendingRegistrations();
//         const pendingRoutes = pendingRegistrations.getPendingRouteIds();

//         if (pendingRoutes.length > 0) {
//             if (pendingRegistrations.isPublicRoutesOutletPending() && pendingRegistrations.isProtectedRoutesOutletPending()) {
//                 // eslint-disable-next-line max-len
//                 throw new Error("[squide] The PublicRoutes and ProtectedRoutes outlets are missing from the router configuration. The PublicRoutes and ProtectedRoutes outlets must be defined as a children of an hoisted route. and ProtectedRoutes outlets and hoist the outlets' parent routes?");
//             } else if (pendingRegistrations.isPublicRoutesOutletPending()) {
//                 throw new Error("[squide] The PublicRoutes outlet is missing from the router configuration. The PublicRoutes outlet must be defined as a children of an hoisted route. Did you include the PublicRoutes outlet and hoist the outlet's parent routes");
//             } else if (pendingRegistrations.isProtectedRoutesOutletPending()) {
//                 throw new Error("[squide] The ProtectedRoutes outlet is missing from the router configuration. The ProtectedRoutes outlet must be defined as a children of an hoisted route. Did you include the ProtectedRoutes outlet and hoist the outlet's parent routes");
//             }

//             let message = `[squide] ${pendingRoutes.length} route${pendingRoutes.length !== 1 ? "s were" : " is"} expected to be registered but ${pendingRoutes.length !== 1 ? "are" : "is"} missing:\r\n\r\n`;

//             pendingRoutes.forEach((x, index) => {
//                 message += `${index + 1}/${pendingRoutes.length} Missing route with the following path or id: "${x}"\r\n`;
//                 message += indent("Pending registrations:\r\n", 1);

//                 const pendingRegistrationsForRoute = pendingRegistrations.getPendingRegistrationsForRoute(x);

//                 pendingRegistrationsForRoute.forEach(y => {
//                     message += indent(`- "${y.path ?? y.$id ?? "(no identifier)"}"\r\n`, 2);
//                 });

//                 message += "\r\n";
//             });

//             message += "Registered routes:\r\n";
//             message += logRoutesTree(this._routeRegistry.routes, 1);
//             message += "\r\n";

//             message += `If you are certain that the route${pendingRoutes.length !== 1 ? "s" : ""} has been registered, make sure that the following conditions are met:\r\n`;
//             message += "- The missing routes \"path\" or \"$id\" option perfectly match the provided \"parentPath\" or \"parentId\" (make sure that there's no leading or trailing \"/\" that differs).\r\n";
//             message += "- The missing routes has been registered with the runtime.registerRoute function. A route cannot be registered under a parent route that has not be registered with the runtime.registerRoute function.\r\n\r\n";
//             message += "For more information about nested routes, refers to https://workleap.github.io/wl-squide/reference/runtime/runtime-class/#register-nested-routes-under-an-existing-route.\r\n\r\n";
//             message += "For more information about the PublicRoutes and ProtectedRoutes outlets, refers to https://workleap.github.io/wl-squide/reference/#routing.";

//             if (this._mode === "development") {
//                 throw new Error(message);
//             } else {
//                 this._logger.error(message);
//             }
//         }
//     }

//     #validateNavigationItemRegistrations() {
//         const pendingRegistrations = this._navigationItemRegistry.getPendingRegistrations();
//         const pendingSectionIds = pendingRegistrations.getPendingSectionIds();

//         if (pendingSectionIds.length > 0) {
//             let message = `[squide] ${pendingSectionIds.length} navigation item${pendingSectionIds.length !== 1 ? "s were" : " is"} expected to be registered but ${pendingSectionIds.length !== 1 ? "are" : "is"} missing:\r\n\r\n`;

//             pendingSectionIds.forEach((x, index) => {
//                 const [menuId, sectionId] = parseSectionIndexKey(x);

//                 message += `${index + 1}/${pendingSectionIds.length} Missing navigation section "${sectionId}" of the "${menuId}" menu.\r\n`;
//                 message += indent("Pending registrations:\r\n", 1);

//                 const pendingItems = pendingRegistrations.getPendingRegistrationsForSection(x);

//                 pendingItems.forEach(y => {
//                     message += indent(`- "${y.item.$id ?? y.item.$label ?? y.item.to ?? "(no identifier)"}"\r\n`, 2);
//                 });

//                 message += "\r\n";
//             });

//             message += `If you are certain that the navigation section${pendingSectionIds.length !== 1 ? "s" : ""} has been registered, make sure that the following conditions are met:\r\n`;
//             message += "- The missing navigation section \"$id\" and \"menuId\" properties perfectly match the provided \"sectionId\" and \"menuId\".\r\n\r\n";
//             message += "For more information about nested navigation items, refers to: https://workleap.github.io/wl-squide/reference/runtime/runtime-class/#register-nested-navigation-items.\r\n";

//             if (this._mode === "development") {
//                 throw new Error(message);
//             } else {
//                 this._logger.error(message);
//             }
//         }
//     }
// }

export interface IReactRouterRuntime extends IRuntime<Route, RootNavigationItem> {}

export class ReactRouterRuntime extends Runtime<Route, RootNavigationItem> implements IReactRouterRuntime {
    protected _routeRegistry = new RouteRegistry();
    protected _navigationItemRegistry = new NavigationItemRegistry();
    protected _navigationItemScope?: NavigationItemDeferredRegistrationScope;

    startDeferredRegistrationScope(options: StartDeferredRegistrationScopeOptions = {}) {
        const {
            transactional = false
        } = options;

        if (this._navigationItemScope) {
            throw new Error("[squide] Cannot start a new deferred registration scope when there's already an active scope. Did you forget to complete the previous scope?");
        }

        if (transactional) {
            this._navigationItemScope = new NavigationItemDeferredRegistrationTransactionalScope(this._navigationItemRegistry);
        } else {
            this._navigationItemScope = new NavigationItemDeferredRegistrationScope(this._navigationItemRegistry);
        }
    }

    completeDeferredRegistrationScope() {
        if (!this._navigationItemScope) {
            throw new Error("[squide] A deferred registration scope must be started before calling the complete function. Did you forget to start the scope?");
        }

        if (this._navigationItemScope) {
            this._navigationItemScope.complete();
            this._navigationItemScope = undefined;
        }
    }

    registerRoute(route: Route, options: RegisterRouteOptions = {}) {
        const logger = this._getLogger(options);
        const result = this._routeRegistry.add(route, options);

        const parentId = translateOutletsParentId(result.parentId);

        if (result.registrationStatus === "registered") {
            const parentLog = parentId ? `as a children of the "${parentId}" route` : "";

            logger
                .withText("[squide] The following route has been")
                .withText("registered", {
                    style: {
                        color: "white",
                        backgroundColor: "green"
                    }
                })
                .withText(parentLog)
                .withText(".", {
                    leadingSpace: false
                })
                .withLineChange()
                .withText("Newly registered item:")
                .withObject(route)
                .withLineChange()
                .withText("All registered routes:")
                .withObject(this._routeRegistry.routes)
                .debug();

            if (result.completedPendingRegistrations.length > 0) {
                logger
                    .withText(`[squide] The pending registration of the following route${result.completedPendingRegistrations.length !== 1 ? "s" : ""} has been`)
                    .withText("completed", {
                        style: {
                            color: "white",
                            backgroundColor: "green"
                        }
                    })
                    .withText(".", {
                        leadingSpace: false
                    })
                    .withLineChange()
                    .withText("Newly registered routes:")
                    .withObject(result.completedPendingRegistrations)
                    .withLineChange()
                    .withText("All registered routes:")
                    .withObject(this._routeRegistry.routes)
                    .debug();
            }
        } else {
            logger
                .withText("[squide] The following route registration is")
                .withText("pending", {
                    style: {
                        color: "black",
                        backgroundColor: "yellow"
                    }
                })
                .withText(`until "${parentId}" is registered.`)
                .withLineChange()
                .withText("Pending registration:")
                .withObject(route)
                .withLineChange()
                .withText("All registered routes:")
                .withObject(this._routeRegistry.routes)
                .debug();
        }
    }

    registerPublicRoute(route: Omit<Route, "$visibility">, options?: RegisterRouteOptions) {
        this.registerRoute({
            $visibility: "public",
            ...route
        } as Route, options);
    }

    get routes() {
        return this._routeRegistry.routes;
    }

    registerNavigationItem(navigationItem: RootNavigationItem, options: RegisterNavigationItemOptions = {}) {
        const {
            menuId = RootMenuId
        } = options;

        const logger = this._getLogger(options);

        if (this._navigationItemScope) {
            const result = this._navigationItemScope.addItem(menuId, navigationItem, options);
            const items = this._navigationItemScope.getItems(menuId)!;

            this.#logNavigationItemRegistrationResult(result, items, logger);
        } else {
            const result = this._navigationItemRegistry.add(menuId, "static", navigationItem, options);
            const items = this._navigationItemRegistry.getItems(menuId)!;

            this.#logNavigationItemRegistrationResult(result, items, logger);
        }
    }

    #logNavigationItemRegistrationResult(result: NavigationItemRegistrationResult, registeredItems: RootNavigationItem[], logger: Logger) {
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

            logger
                .withText(`[squide] The following ${registrationType} navigation item has been`)
                .withText("registered", {
                    style: {
                        color: "white",
                        backgroundColor: "green"
                    }
                })
                .withText(`${sectionLog} the "${menuId}" menu for a total of ${registeredItems.length} ${registrationType} item${registeredItems.length !== 1 ? "s" : ""}.`)
                .withLineChange()
                .withText("Newly registered item:")
                .withObject(newItem)
                .withLineChange()
                .withText("All registered items:")
                .withObject(registeredItems)
                .debug();

            if (completedPendingRegistrations.length > 0) {
                logger
                    .withText(`[squide] The pending registration of the following ${registrationType} navigation item${completedPendingRegistrations.length !== 1 ? "s" : ""} has been`)
                    .withText("completed", {
                        style: {
                            color: "white",
                            backgroundColor: "green"
                        }
                    })
                    .withText(".", {
                        leadingSpace: false
                    })
                    .withLineChange()
                    .withText("Newly registered items:")
                    .withObject(completedPendingRegistrations)
                    .withLineChange()
                    .withText("All registered items:")
                    .withObject(registeredItems)
                    .debug();
            }
        } else {
            logger
                .withText(`[squide] The following ${registrationType} navigation item registration is`)
                .withText("pending", {
                    style: {
                        color: "black",
                        backgroundColor: "yellow"
                    }
                })
                .withText(`until the "${sectionId}" section of the "${menuId}" menu is registered.`)
                .withLineChange()
                .withText("Pending registration:")
                .withObject(newItem)
                .withLineChange()
                .withText("All registered items:")
                .withObject(registeredItems)
                .debug();
        }
    }

    getNavigationItems(options: GetNavigationItemsOptions = {}) {
        const {
            menuId = RootMenuId
        } = options;

        return this._navigationItemRegistry.getItems(menuId);
    }

    startScope(logger: Logger): ReactRouterRuntime {
        return (new ReactRouterRuntimeScope(this, logger) as unknown) as ReactRouterRuntime;
    }

    _validateRegistrations(options?: ValidateRegistrationsOptions) {
        const logger = this._getLogger(options);

        this.#validateRouteRegistrations(logger);
        this.#validateNavigationItemRegistrations(logger);
    }

    #validateRouteRegistrations(logger: Logger) {
        const pendingRegistrations = this._routeRegistry.getPendingRegistrations();
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
            message += logRoutesTree(this._routeRegistry.routes, 1);
            message += "\r\n";

            message += `If you are certain that the route${pendingRoutes.length !== 1 ? "s" : ""} has been registered, make sure that the following conditions are met:\r\n`;
            message += "- The missing routes \"path\" or \"$id\" option perfectly match the provided \"parentPath\" or \"parentId\" (make sure that there's no leading or trailing \"/\" that differs).\r\n";
            message += "- The missing routes has been registered with the runtime.registerRoute function. A route cannot be registered under a parent route that has not be registered with the runtime.registerRoute function.\r\n\r\n";
            message += "For more information about nested routes, refers to https://workleap.github.io/wl-squide/reference/runtime/runtime-class/#register-nested-routes-under-an-existing-route.\r\n\r\n";
            message += "For more information about the PublicRoutes and ProtectedRoutes outlets, refers to https://workleap.github.io/wl-squide/reference/#routing.";

            if (this._mode === "development") {
                throw new Error(message);
            } else {
                logger.error(message);
            }
        }
    }

    #validateNavigationItemRegistrations(logger: Logger) {
        const pendingRegistrations = this._navigationItemRegistry.getPendingRegistrations();
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
                logger.error(message);
            }
        }
    }
}

export class ReactRouterRuntimeScope<TRuntime extends ReactRouterRuntime = ReactRouterRuntime> extends RuntimeScope<Route, RootNavigationItem, TRuntime> implements IReactRouterRuntime {}
