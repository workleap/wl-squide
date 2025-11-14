import type { RegisterRouteOptions, RuntimeMethodOptions, RuntimeOptions } from "@squide/core";
import { MswPlugin, MswPluginName, MswState } from "@squide/msw";
import { type IReactRouterRuntime, ReactRouterRuntime, ReactRouterRuntimeScope, type Route } from "@squide/react-router";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import type { Logger } from "@workleap/logging";
import type { RequestHandler } from "msw";
import { type AppRouterStore, createAppRouterStore } from "./AppRouterStore.ts";

export interface FireflyRuntimeOptions extends RuntimeOptions {
    // useMsw?: boolean;
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
}

export interface RegisterRequestHandlersOptions extends RuntimeMethodOptions {}

export interface IFireflyRuntime extends IReactRouterRuntime {
    get mswState(): MswState;
    registerRequestHandlers: (handlers: RequestHandler[]) => void;
    get requestHandlers(): RequestHandler[];
    get appRouterStore(): AppRouterStore;
    get isMswEnabled(): boolean;
    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient | undefined;
}

export class FireflyRuntime extends ReactRouterRuntime implements IFireflyRuntime {
    protected _appRouterStore: AppRouterStore;
    // protected _useMsw: boolean;
    protected _honeycombInstrumentationClient: HoneycombInstrumentationPartialClient | undefined;

    // constructor({ useMsw, honeycombInstrumentationClient, ...options }: FireflyRuntimeOptions = {}) {
    constructor({ honeycombInstrumentationClient, ...options }: FireflyRuntimeOptions = {}) {
        super(options);

        this._appRouterStore = createAppRouterStore(this._logger);
        // this._useMsw = !!useMsw;
        this._honeycombInstrumentationClient = honeycombInstrumentationClient;
    }

    get mswState() {
        const mswPlugin = this.getPlugin(MswPluginName) as MswPlugin;

        if (!mswPlugin) {
            throw new Error("[squide] Cannot register the provided MSW request handlers because the runtime hasn't been initialized with MSW. Did you instanciate the FireflyRuntime with the \"useMsw\" option?");
        }

        return mswPlugin.mswState;
    }

    registerRequestHandlers(handlers: RequestHandler[], options: RegisterRequestHandlersOptions = {}) {
        const logger = this._getLogger(options);
        const mswPlugin = this.getPlugin(MswPluginName) as MswPlugin;

        if (!mswPlugin) {
            throw new Error("[squide] Cannot register the provided MSW request handlers because the runtime hasn't been initialized with MSW. Did you instanciate the FireflyRuntime with the \"useMsw\" option?");
        }

        // if (getAreModulesRegistered(this)) {
        if (this.moduleManager.getAreModulesRegistered()) {
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
        // if (getAreModulesRegistered(this)) {
        if (this.moduleManager.getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register a route once the modules are registered. Are you trying to register a route in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        super.registerRoute(route, options);
    }

    get appRouterStore() {
        return this._appRouterStore;
    }

    get isMswEnabled() {
        return this._plugins.some(x => x.name === MswPluginName);
    }

    get honeycombInstrumentationClient() {
        return this._honeycombInstrumentationClient;
    }

    startScope(logger: Logger): FireflyRuntime {
        return (new FireflyRuntimeScope(this, logger) as unknown) as FireflyRuntime;
    }
}

export class FireflyRuntimeScope<TRuntime extends FireflyRuntime = FireflyRuntime> extends ReactRouterRuntimeScope<TRuntime> implements IFireflyRuntime {
    get mswState() {
        return this._runtime.mswState;
    }

    registerRequestHandlers(handlers: RequestHandler[], options: RegisterRequestHandlersOptions = {}) {
        this._runtime.registerRequestHandlers(handlers, {
            ...options,
            logger: this._getLogger(options)
        });
    }

    get requestHandlers() {
        return this._runtime.requestHandlers;
    }

    get appRouterStore(): AppRouterStore {
        throw new Error("[squide] Cannot retrieve the app router store from a runtime scope instance.");
    }

    get isMswEnabled() {
        return this._runtime.isMswEnabled;
    }

    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient {
        throw new Error("[squide] Cannot retrieve the Honeycomb instrumentation client from a runtime scope instance.");
    }
}
