import { createCompositeLogger, type Logger, type RootLogger } from "@workleap/logging";
import { EventBus } from "../messaging/eventBus.ts";
import type { Plugin } from "../plugins/plugin.ts";
import { LocalModuleRegistry, LocalModuleRegistryId } from "../registration/LocalModuleRegistry.ts";
import { ModuleManager } from "../registration/ModuleManager.ts";
import { ModuleRegistrationError, RegisterModulesOptions } from "../registration/moduleRegistry.ts";
import { ModuleRegisterFunction } from "../registration/registerModule.ts";

export type RuntimeMode = "development" | "production";

export type PluginFactory = (runtime: Runtime) => Plugin;

export interface RuntimeOptions {
    mode?: RuntimeMode;
    moduleManager?: ModuleManager;
    loggers?: RootLogger[];
    plugins?: PluginFactory[];
}

export interface RuntimeMethodOptions {
    logger?: Logger;
}

export interface RegisterRouteOptions extends RuntimeMethodOptions {
    hoist?: true;
    parentPath?: string;
    parentId?: string;
}

export interface RegisterNavigationItemOptions extends RuntimeMethodOptions {
    menuId?: string;
    sectionId?: string;
}

export interface GetNavigationItemsOptions {
    menuId?: string;
}

export interface StartDeferredRegistrationScopeOptions extends RuntimeMethodOptions {
    transactional?: boolean;
}

export interface CompleteDeferredRegistrationScopeOptions extends RuntimeMethodOptions {}

export interface ValidateRegistrationsOptions extends RuntimeMethodOptions {}

export const RootMenuId = "root";

export interface IRuntime<TRoute = unknown, TNavigationItem = unknown> {
    registerLocalModules<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(registrationFunctions: ModuleRegisterFunction<TRuntime, TContext, TData>[], options?: RegisterModulesOptions<TContext>): Promise<ModuleRegistrationError[]>;
    get moduleManager(): ModuleManager;
    registerRoute: (route: TRoute, options?: RegisterRouteOptions) => void;
    registerPublicRoute: (route: Omit<TRoute, "visibility">, options?: RegisterRouteOptions) => void;
    get routes(): TRoute[];
    registerNavigationItem: (navigationItem: TNavigationItem, options?: RegisterNavigationItemOptions) => void;
    getNavigationItems: (options?: GetNavigationItemsOptions) => TNavigationItem[];
    startDeferredRegistrationScope: (options?: StartDeferredRegistrationScopeOptions) => void;
    completeDeferredRegistrationScope: (options?: CompleteDeferredRegistrationScopeOptions) => void;
    get mode(): RuntimeMode;
    get plugins(): Plugin[];
    getPlugin: (pluginName: string) => Plugin;
    get logger(): Logger;
    get eventBus(): EventBus;
    startScope: (logger: Logger) => Runtime;
    _getLogger: (options?: RuntimeMethodOptions) => Logger;
    _validateRegistrations: (options?: ValidateRegistrationsOptions) => void;
}

export abstract class Runtime<TRoute = unknown, TNavigationItem = unknown> implements IRuntime<TRoute, TNavigationItem> {
    protected readonly _mode: RuntimeMode;
    protected readonly _moduleManager: ModuleManager;
    protected readonly _logger: Logger;
    protected readonly _eventBus: EventBus;
    protected readonly _plugins: Plugin[];

    constructor(options: RuntimeOptions = {}) {
        const {
            mode = "development",
            moduleManager = new ModuleManager(this, [new LocalModuleRegistry()]),
            loggers = [],
            plugins = []
        } = options;

        this._mode = mode;
        this._moduleManager = moduleManager;
        this._logger = createCompositeLogger(mode === "development", loggers);
        this._eventBus = new EventBus(this._logger);
        this._plugins = plugins.map(x => x(this));
    }

    registerLocalModules<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(registrationFunctions: ModuleRegisterFunction<TRuntime, TContext, TData>[], options?: RegisterModulesOptions<TContext>) {
        return this._moduleManager.registerModules(registrationFunctions.map(x => ({
            definition: x,
            registryId: LocalModuleRegistryId
        })), options);
    }

    get moduleManager(): ModuleManager {
        return this._moduleManager;
    }

    abstract registerRoute(route: TRoute, options?: RegisterRouteOptions): void;

    abstract registerPublicRoute(route: Omit<TRoute, "visibility">, options?: RegisterRouteOptions): void;

    abstract get routes(): TRoute[];

    abstract registerNavigationItem(navigationItem: TNavigationItem, options?: RegisterNavigationItemOptions): void;

    abstract getNavigationItems(options?: GetNavigationItemsOptions): TNavigationItem[];

    abstract startDeferredRegistrationScope(options?: StartDeferredRegistrationScopeOptions): void;

    abstract completeDeferredRegistrationScope(options?: CompleteDeferredRegistrationScopeOptions): void;

    get mode() {
        return this._mode;
    }

    get plugins() {
        return this._plugins;
    }

    getPlugin(pluginName: string) {
        const plugin = this._plugins.find(x => x.name === pluginName);

        if (!plugin) {
            throw new Error(`[squide] Cannot find a plugin named "${pluginName}". Did you register an instance of the plugin with the application Runtime instance?`);
        }

        return plugin;
    }

    get logger() {
        return this._logger;
    }

    get eventBus() {
        return this._eventBus;
    }

    abstract startScope(logger: Logger): Runtime;

    _getLogger(options: RuntimeMethodOptions = {}) {
        const {
            logger
        } = options;

        return logger ? logger : this._logger;
    }

    abstract _validateRegistrations(options?: ValidateRegistrationsOptions): void;
}

export abstract class RuntimeScope<TRoute = unknown, TNavigationItem = unknown, TRuntime extends Runtime<TRoute, TNavigationItem> = Runtime<TRoute, TNavigationItem>> implements IRuntime<TRoute, TNavigationItem> {
    protected readonly _runtime: TRuntime;
    protected readonly _logger: Logger;

    constructor(runtime: TRuntime, logger: Logger) {
        this._runtime = runtime;
        this._logger = logger;
    }

    registerLocalModules(): Promise<ModuleRegistrationError[]> {
        throw new Error("[squide] Cannot register local modules from a runtime scope instance.");
    }

    get moduleManager(): ModuleManager {
        throw new Error("[squide] Cannot retrieve the module manager from a runtime scope instance.");
    }

    registerRoute(route: TRoute, options: RegisterRouteOptions = {}) {
        this._runtime.registerRoute(route, {
            ...options,
            logger: this._getLogger(options)
        });
    }

    registerPublicRoute(route: Omit<TRoute, "visibility">, options: RegisterRouteOptions = {}) {
        this._runtime.registerPublicRoute(route, {
            ...options,
            logger: this._getLogger(options)
        });
    }

    get routes(): TRoute[] {
        return this._runtime.routes;
    }

    registerNavigationItem(navigationItem: TNavigationItem, options: RegisterNavigationItemOptions = {}) {
        this._runtime.registerNavigationItem(navigationItem, {
            ...options,
            logger: this._getLogger(options)
        });
    }

    getNavigationItems(options?: GetNavigationItemsOptions) {
        return this._runtime.getNavigationItems(options);
    }

    // startDeferredRegistrationScope(options: StartDeferredRegistrationScopeOptions = {}) {
    //     this._runtime.startDeferredRegistrationScope({
    //         ...options,
    //         logger: this._getLogger(options)
    //     });
    // }

    // completeDeferredRegistrationScope(options: CompleteDeferredRegistrationScopeOptions = {}) {
    //     this._runtime.completeDeferredRegistrationScope({
    //         ...options,
    //         logger: this._getLogger(options)
    //     });
    // }

    startDeferredRegistrationScope() {
        throw new Error("[squide] Cannot start a deferred registration scope from a runtime scope instance.");
    }

    completeDeferredRegistrationScope() {
        throw new Error("[squide] Cannot complete a deferred registration scope from a runtime scope instance.");
    }

    get mode(): RuntimeMode {
        return this._runtime.mode;
    }

    get plugins(): Plugin[] {
        return this._runtime.plugins;
    }

    getPlugin(pluginName: string) {
        return this._runtime.getPlugin(pluginName);
    }

    get logger() {
        return this._runtime.logger;
    }

    get eventBus() {
        return this._runtime.eventBus;
    }

    startScope(): TRuntime {
        throw new Error("[squide] Cannot start a runtime scope from a runtime scope instance.");
    }

    _getLogger(options: RuntimeMethodOptions = {}) {
        const {
            logger
        } = options;

        return logger ? logger : this._logger;
    }

    // _validateRegistrations(options: ValidateRegistrationsOptions = {}) {
    //     this._runtime._validateRegistrations({
    //         ...options,
    //         logger: this._getLogger(options)
    //     });
    // }

    _validateRegistrations() {
        throw new Error("[squide] Cannot validate registrations from a runtime scope instance.");
    }
}
