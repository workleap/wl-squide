import { createCompositeLogger, type Logger, type RootLogger } from "@workleap/logging";
import { EventBus } from "../messaging/eventBus.ts";
import type { Plugin } from "../plugins/plugin.ts";

export type RuntimeMode = "development" | "production";

export type PluginFactory = (runtime: Runtime) => Plugin;

export interface RuntimeOptions {
    mode?: RuntimeMode;
    loggers?: RootLogger[];
    plugins?: PluginFactory[];
}

export interface RegisterRouteOptions {
    hoist?: true;
    parentPath?: string;
    parentId?: string;
}

export interface RegisterNavigationItemOptions {
    menuId?: string;
    sectionId?: string;
}

export const RootMenuId = "root";

export interface RuntimeMembers {
    mode: RuntimeMode;
    logger: Logger;
    eventBus: EventBus;
    plugins: Plugin[];
}

const runtimeMembersKeys: (keyof RuntimeMembers)[] = [
    "mode",
    "logger",
    "eventBus",
    "plugins"
];

export function isRuntimeMembers(obj: unknown): obj is RuntimeMembers {
    if (obj && typeof obj === "object") {
        return runtimeMembersKeys.every(
            x => x in obj
        );
    }

    return false;
}

export abstract class Runtime<TRoute = unknown, TNavigationItem = unknown> {
    protected _mode: RuntimeMode;
    protected readonly _logger: Logger;
    protected readonly _eventBus: EventBus;
    protected readonly _plugins: Plugin[];

    constructor(options?: RuntimeOptions);
    constructor(members?: RuntimeMembers);

    constructor(obj?: RuntimeOptions | RuntimeMembers) {
        if (isRuntimeMembers(obj)) {
            this._mode = obj.mode;
            this._logger = obj.logger;
            this._eventBus = obj.eventBus;
            this._plugins = obj.plugins;
        } else {
            const {
                mode = "development",
                loggers = [],
                plugins = []
            } = (obj ?? {});

            this._mode = mode;
            this._logger = createCompositeLogger(mode === "development", loggers);
            this._eventBus = new EventBus(this._logger);
            this._plugins = plugins.map(x => x(this));
        }
    }

    abstract registerRoute(route: TRoute, options?: RegisterRouteOptions): void;

    abstract registerPublicRoute(route: Omit<TRoute, "visibility">, options?: RegisterRouteOptions): void;

    abstract get routes(): TRoute[];

    abstract registerNavigationItem(navigationItem: TNavigationItem, options?: RegisterNavigationItemOptions): void;

    abstract getNavigationItems(menuId?: string): TNavigationItem[];

    abstract startDeferredRegistrationScope(transactional?: boolean): void;

    abstract completeDeferredRegistrationScope(): void;

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

    validateRegistrations() {}
}
