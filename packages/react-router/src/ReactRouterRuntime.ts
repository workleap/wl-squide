import { RootMenuId, Runtime, RuntimeScope, type CompleteDeferredRegistrationScopeOptions, type GetNavigationItemsOptions, type IRuntime, type RegisterNavigationItemOptions, type RegisterRouteOptions, type StartDeferredRegistrationScopeOptions, type ValidateRegistrationsOptions } from "@squide/core";
import { isNil } from "@squide/core/internal";
import type { Logger } from "@workleap/logging";
import { NavigationItemDeferredRegistrationScope, NavigationItemDeferredRegistrationTransactionalScope, NavigationItemRegistry, type DuplicateSectionDeclaration, type NavigationItemRegistrationResult, type RootNavigationItem } from "./NavigationItemRegistry.ts";
import { ProtectedRoutesOutletId, PublicRoutesOutletId } from "./outlets.ts";
import { RouteRegistry, type Route } from "./RouteRegistry.ts";

function indent(text: string, depth: number) {
    return `${" ".repeat(depth * 4)}${text}`;
}

// An inline declaration is dropped from the position it was written in, therefore where it was written is what
// tells the author which module to look at.
function formatInlineDeclarationPosition(declaration: DuplicateSectionDeclaration) {
    if (!declaration.isInlineDeclaration) {
        return "";
    }

    return declaration.inlineParentSectionId
        ? `, declared inline in the "${declaration.inlineParentSectionId}" section`
        : ", declared inline in another section";
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

function applyPublicVisibilityToChildren(routes: Route[]) {
    return routes.map(x => {
        const route: Route = {
            $visibility: "public",
            ...x
        };

        if (route.children) {
            // Recursively go through the children.
            route.children = applyPublicVisibilityToChildren(route.children);
        }

        return route;
    });
}

export interface IReactRouterRuntime extends IRuntime<Route, RootNavigationItem> {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ReactRouterRuntime<TRuntime extends ReactRouterRuntime = any> extends Runtime<Route, RootNavigationItem, TRuntime> implements IReactRouterRuntime {
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

    completeDeferredRegistrationScope(options: CompleteDeferredRegistrationScopeOptions = {}) {
        if (!this._navigationItemScope) {
            throw new Error("[squide] A deferred registration scope must be started before calling the complete function. Did you forget to start the scope?");
        }

        const logger = this._getLogger(options);

        try {
            // The replay adds the buffered items straight to the registry, bypassing "registerNavigationItem",
            // so this is the only place where their real outcome can be reported. The per module logger scopes
            // have already ended by now, which is why the messages carry the menu and section identity.
            const results = this._navigationItemScope.complete();

            results.forEach(x => {
                this.#logNavigationItemRegistrationResult(x, this._navigationItemRegistry.getItems(x.menuId), logger);
            });
        } finally {
            // The scope must always be released, otherwise a failed completion would prevent every subsequent
            // deferred registration update for the lifetime of the runtime.
            this._navigationItemScope = undefined;
        }
    }

    registerRoute(route: Route, options: RegisterRouteOptions = {}) {
        const logger = this._getLogger(options);
        const result = this._routeRegistry.add(route, options);

        const parentId = translateOutletsParentId(result.parentId);

        if (result.registrationStatus === "registered") {
            const parentLog = parentId ? `as a children of the route with id "${parentId}"` : "";

            if (route.index) {
                logger.withText("[squide] An index route has been");
            } else {
                if (route.path) {
                    logger.withText(`[squide] A route with path "${route.path}" has been`);
                } else if (route.id) {
                    logger.withText(`[squide] A route with id "${route.id}" has been`);
                } else {
                    logger.withText("[squide] A pathless route has been");
                }
            }

            logger
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
            if (route.index) {
                logger.withText("[squide] An index route registration is");
            } else {
                if (route.path) {
                    logger.withText(`[squide] A route with path "${route.path}" registration is`);
                } else if (route.id) {
                    logger.withText(`[squide] A route with id "${route.id}" registration is`);
                } else {
                    logger.withText("[squide] A pathless route registration is");
                }
            }

            logger
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
            ...route,
            ...(route.children ? { children: applyPublicVisibilityToChildren(route.children) } : {})
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
            const items = this._navigationItemScope.getItems(menuId);

            this.#logNavigationItemRegistrationResult(result, items, logger);
        } else {
            const result = this._navigationItemRegistry.add(menuId, "static", navigationItem, options);
            const items = this._navigationItemRegistry.getItems(menuId);

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
            const sectionLog = sectionId ? `under the section with id "${sectionId}" of` : "to";

            if (newItem.$id) {
                logger.withText(`[squide] A ${registrationType} navigation item with path "${newItem.to}" and id "${newItem.$id}" has been`);
            } else {
                logger.withText(`[squide] A ${registrationType} navigation item with path "${newItem.to}" has been`);
            }

            logger
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
        } else if (registrationStatus === "buffered") {
            if (newItem.$id) {
                logger.withText(`[squide] A ${registrationType} navigation item with path "${newItem.to}" and id "${newItem.$id}" registration is`);
            } else {
                logger.withText(`[squide] A ${registrationType} navigation item with path "${newItem.to}" registration is`);
            }

            logger
                .withText("buffered", {
                    style: {
                        color: "white",
                        backgroundColor: "blue"
                    }
                })
                .withText(`until the deferred registration update of the "${menuId}" menu completes, its outcome is reported at that point.`)
                .withLineChange()
                .withText("Buffered registration:")
                .withObject(newItem)
                .withLineChange()
                .withText("All buffered items:")
                .withObject(registeredItems)
                .debug();
        } else if (registrationStatus === "deduplicated") {
            logger.withText(`[squide] A ${registrationType} navigation section with id "${newItem.$id}" declaration has been`);

            logger
                .withText("deduplicated", {
                    style: {
                        color: "white",
                        backgroundColor: "grey"
                    }
                })
                .withText(`because the section is already registered for the "${menuId}" menu. Nest items under it with the "sectionId" option, the children of this declaration are ignored.`)
                .withLineChange()
                .withText("Deduplicated declaration:")
                .withObject(newItem)
                .withLineChange()
                .withText("All registered items:")
                .withObject(registeredItems)
                .debug();
        } else {
            if (newItem.$id) {
                logger.withText(`[squide] A ${registrationType} navigation item with path "${newItem.to}" and id "${newItem.$id}" registration is`);
            } else {
                logger.withText(`[squide] A ${registrationType} navigation item with path "${newItem.to}" registration is`);
            }

            logger
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

    getNavigationItemsByMenu() {
        return this._navigationItemRegistry.getAllItemsByMenu();
    }

    startScope(logger: Logger): TRuntime {
        return (new ReactRouterRuntimeScope(this, logger) as unknown) as TRuntime;
    }

    _validateRegistrations(options: ValidateRegistrationsOptions = {}) {
        const {
            includeRoutes = true
        } = options;

        const logger = this._getLogger(options);

        if (includeRoutes) {
            this.#validateRouteRegistrations(logger);
        }

        this.#validateNavigationItemRegistrations(logger);
        this.#validateNavigationSectionDeclarations(logger);
    }

    #validateRouteRegistrations(logger: Logger) {
        const pendingRegistrations = this._routeRegistry.getPendingRegistrations();
        const pendingRoutes = pendingRegistrations.getPendingRouteIds();

        if (pendingRoutes.length > 0) {
            if (pendingRegistrations.isPublicRoutesOutletPending() && pendingRegistrations.isProtectedRoutesOutletPending()) {
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
            // The count is a number of sections, not of items. A single missing section can hold several
            // pending registrations, which are listed under it.
            let message = `[squide] ${pendingSectionIds.length} navigation section${pendingSectionIds.length !== 1 ? "s were" : " is"} expected to be registered but ${pendingSectionIds.length !== 1 ? "are" : "is"} missing:\r\n\r\n`;

            pendingSectionIds.forEach((x, index) => {
                const pendingItems = pendingRegistrations.getPendingRegistrationsForSection(x);

                // The items carry the "menuId" and the "sectionId" they are waiting for, which avoids
                // depending on the index key format. An index key always holds at least one item. The fallback
                // below only ensures that a failure to name the section can never mask the pending
                // registrations this message is reporting.
                const firstPendingItem = pendingItems.at(0);

                if (firstPendingItem) {
                    message += `${index + 1}/${pendingSectionIds.length} Missing navigation section "${firstPendingItem.sectionId}" of the "${firstPendingItem.menuId}" menu.\r\n`;
                } else {
                    message += `${index + 1}/${pendingSectionIds.length} Missing navigation section for the index key "${x}".\r\n`;
                }

                message += indent("Pending registrations:\r\n", 1);

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

    #validateNavigationSectionDeclarations(logger: Logger) {
        const duplicateDeclarations = this._navigationItemRegistry.getDuplicateSectionDeclarations();

        // A section is worth reporting for two different reasons, and a declaration falls in exactly one of
        // them. A declaration that found the section already registered contributes nothing, but a shared
        // section that several modules declare identically is the supported way to contribute to a menu that no
        // module owns, so only a declaration that lost something is reported: inline children, a "$priority", a
        // "sectionId", the position it was written in, or a string label that isn't the registered one. A
        // declaration that is registered and only lost the identifier is always reported, since two sections of
        // the same menu answering to the same "$id" is never intended.
        const conflictingSections = duplicateDeclarations.getDuplicatedSectionIds()
            .map(x => {
                const declarations = duplicateDeclarations.getDeclarationsForSection(x);

                return {
                    ignoredDeclarations: declarations.filter(y => {
                        return !y.isRegistered && (
                            (y.item.children?.length ?? 0) > 0
                            || !isNil(y.item.$priority)
                            || !isNil(y.parentSectionId)
                            || y.isInlineDeclaration
                            || y.hasConflictingLabel
                        );
                    }),
                    conflictingIdentifierDeclarations: declarations.filter(y => y.isRegistered)
                };
            })
            .filter(x => x.ignoredDeclarations.length > 0 || x.conflictingIdentifierDeclarations.length > 0);

        if (conflictingSections.length > 0) {
            let message = `[squide] ${conflictingSections.length} navigation section${conflictingSections.length !== 1 ? "s have" : " has"} been declared more than once for a menu. The first declaration is the one that has been registered and that owns the section identifier:\r\n\r\n`;

            conflictingSections.forEach(({ ignoredDeclarations, conflictingIdentifierDeclarations }, index) => {
                const firstDeclaration = ignoredDeclarations[0] ?? conflictingIdentifierDeclarations[0];

                message += `${index + 1}/${conflictingSections.length} Navigation section "${firstDeclaration.sectionId}" of the "${firstDeclaration.menuId}" menu.\r\n`;

                if (ignoredDeclarations.length > 0) {
                    message += indent("Ignored declarations:\r\n", 1);

                    ignoredDeclarations.forEach(x => {
                        const conflicts: string[] = [];

                        if (x.item.children?.length) {
                            conflicts.push(`${x.item.children.length} child${x.item.children.length !== 1 ? "ren" : ""}`);
                        }

                        if (!isNil(x.item.$priority)) {
                            conflicts.push(`a "$priority" option of ${x.item.$priority}`);
                        }

                        if (!isNil(x.parentSectionId)) {
                            conflicts.push(`a "sectionId" option of "${x.parentSectionId}"`);
                        }

                        if (x.hasConflictingLabel) {
                            conflicts.push(`a "$label" of "${x.item.$label}"`);
                        }

                        const options = conflicts.length > 0 ? ` with ${conflicts.join(", ")}` : "";

                        message += indent(`- A ${x.registrationType} declaration${options}${formatInlineDeclarationPosition(x)}.\r\n`, 2);
                    });
                }

                if (conflictingIdentifierDeclarations.length > 0) {
                    message += indent("Declarations that are registered but do not own the identifier:\r\n", 1);

                    conflictingIdentifierDeclarations.forEach(x => {
                        const position = !isNil(x.parentSectionId)
                            ? ` nested under the "${x.parentSectionId}" section`
                            : formatInlineDeclarationPosition(x);

                        const label = x.hasConflictingLabel ? `, with a "$label" of "${x.item.$label}"` : "";

                        message += indent(`- A ${x.registrationType} declaration${position}${label}.\r\n`, 2);
                    });
                }

                message += "\r\n";
            });

            message += "If you are contributing navigation items to a section that no module owns, declare the section without children and register the items under it with the \"sectionId\" option.\r\n";

            if (this._mode === "development") {
                throw new Error(message);
            } else {
                logger.error(message);
            }
        }
    }
}

export class ReactRouterRuntimeScope<TRuntime extends ReactRouterRuntime = ReactRouterRuntime> extends RuntimeScope<Route, RootNavigationItem, TRuntime> implements IReactRouterRuntime {}
