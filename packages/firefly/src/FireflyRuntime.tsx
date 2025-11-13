import type { RegisterRouteOptions, RuntimeMethodOptions, RuntimeOptions } from "@squide/core";
import { MswPlugin, MswPluginName } from "@squide/msw";
import { type IReactRouterRuntime, ReactRouterRuntime, ReactRouterRuntimeScope, type Route } from "@squide/react-router";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import type { Logger } from "@workleap/logging";
import type { RequestHandler } from "msw";
import { getAreModulesRegistered } from "./AppRouterReducer.ts";
import { type AppRouterStore, createAppRouterStore } from "./AppRouterStore.ts";

export interface FireflyRuntimeOptions extends RuntimeOptions {
    useMsw?: boolean;
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
}

export interface RegisterRequestHandlersOptions extends RuntimeMethodOptions {}

export interface IFireflyRuntime extends IReactRouterRuntime {
    registerRequestHandlers: (handlers: RequestHandler[]) => void;
    get requestHandlers(): RequestHandler[];
    get appRouterStore(): AppRouterStore;
    get isMswEnabled(): boolean;
    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient | undefined;
}

export class FireflyRuntime extends ReactRouterRuntime implements IFireflyRuntime {
    protected _appRouterStore: AppRouterStore;
    protected _useMsw: boolean;
    protected _honeycombInstrumentationClient: HoneycombInstrumentationPartialClient | undefined;

    constructor({ plugins, useMsw, honeycombInstrumentationClient, ...options }: FireflyRuntimeOptions = {}) {
        if (useMsw) {
            super({
                plugins: [
                    ...(plugins ?? []),
                    runtime => new MswPlugin(runtime)
                ],
                ...options
            });

            this._useMsw = true;
        } else {
            super({
                plugins,
                ...options
            });

            this._useMsw = false;
        }

        this._appRouterStore = createAppRouterStore(this._logger);
        this._honeycombInstrumentationClient = honeycombInstrumentationClient;
    }

    registerRequestHandlers(handlers: RequestHandler[], options: RegisterRequestHandlersOptions = {}) {
        const logger = this._getLogger(options);
        const mswPlugin = this.getPlugin(MswPluginName) as MswPlugin;

        if (!mswPlugin) {
            throw new Error("[squide] Cannot register the provided MSW request handlers because the runtime hasn't been initialized with MSW. Did you instanciate the FireflyRuntime with the \"useMsw\" option?");
        }

        if (getAreModulesRegistered(this)) {
            throw new Error("[squide] Cannot register an MSW request handlers once the modules are registered. Are you trying to register an MSW request handler in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        mswPlugin.registerRequestHandlers(handlers, {
            logger
        });
    }

    // Must define a return type otherwise we get an "error TS2742: The inferred type of 'requestHandlers' cannot be named" error.
    get requestHandlers(): RequestHandler[] {
        const mswPlugin = this.getPlugin(MswPluginName) as MswPlugin;

        if (!mswPlugin) {
            throw new Error("[squide] Cannot retrieve MSW request handlers because the runtime hasn't been initialized with MSW. Did you instanciate the FireflyRuntime with the \"useMsw\" option?");
        }

        return mswPlugin.requestHandlers;
    }

    registerRoute(route: Route, options: RegisterRouteOptions = {}) {
        if (getAreModulesRegistered(this)) {
            throw new Error("[squide] Cannot register a route once the modules are registered. Are you trying to register a route in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        super.registerRoute(route, options);
    }

    get appRouterStore() {
        return this._appRouterStore;
    }

    get isMswEnabled() {
        return this._useMsw;
    }

    get honeycombInstrumentationClient() {
        return this._honeycombInstrumentationClient;
    }

    startScope(logger: Logger): FireflyRuntime {
        return (new FireflyRuntimeScope(this, logger) as unknown) as FireflyRuntime;
    }
}

export class FireflyRuntimeScope<TRuntime extends FireflyRuntime = FireflyRuntime> extends ReactRouterRuntimeScope<TRuntime> implements IFireflyRuntime {
    registerRequestHandlers(handlers: RequestHandler[], options: RegisterRequestHandlersOptions = {}) {
        this._runtime.registerRequestHandlers(handlers, {
            ...options,
            logger: this._getLogger(options)
        });
    }

    get requestHandlers(): RequestHandler[] {
        return this._runtime.requestHandlers;
    }

    get appRouterStore() {
        return this._runtime.appRouterStore;
    }

    get isMswEnabled() {
        return this._runtime.isMswEnabled;
    }

    get honeycombInstrumentationClient() {
        return this._runtime.honeycombInstrumentationClient;
    }
}
