import type { RegisterRouteOptions, RuntimeMethodOptions, RuntimeOptions } from "@squide/core";
import { EnvironmentVariables, EnvironmentVariablesKey, EnvironmentVariablesPlugin, EnvironmentVariablesValue, getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { getMswPlugin, MswPluginName, MswState } from "@squide/msw";
import { type IReactRouterRuntime, ReactRouterRuntime, ReactRouterRuntimeScope, type Route } from "@squide/react-router";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import type { Logger } from "@workleap/logging";
import type { RequestHandler } from "msw";
import { type AppRouterStore, createAppRouterStore } from "./AppRouterStore.ts";

export interface FireflyRuntimeOptions<TRuntime extends FireflyRuntime = FireflyRuntime> extends RuntimeOptions<TRuntime> {
    environmentVariables?: Partial<EnvironmentVariables>;
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
}

export interface RegisterRequestHandlersOptions extends RuntimeMethodOptions {}

export interface IFireflyRuntime extends IReactRouterRuntime {
    getMswState(): MswState;
    registerRequestHandlers: (handlers: RequestHandler[]) => void;
    get requestHandlers(): RequestHandler[];
    get isMswEnabled(): boolean;
    registerVariable(key: EnvironmentVariablesKey, value: EnvironmentVariablesValue): void;
    registerVariables(variables: Partial<EnvironmentVariables>): void;
    getVariable(key: EnvironmentVariablesKey): EnvironmentVariablesValue;
    getVariables(): EnvironmentVariables;
    get appRouterStore(): AppRouterStore;
    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FireflyRuntime<TRuntime extends FireflyRuntime = any> extends ReactRouterRuntime<TRuntime> implements IFireflyRuntime {
    protected _appRouterStore: AppRouterStore;
    protected _honeycombInstrumentationClient: HoneycombInstrumentationPartialClient | undefined;

    constructor(options: FireflyRuntimeOptions = {}) {
        const {
            environmentVariables,
            plugins = [],
            honeycombInstrumentationClient,
            ...rest
        } = options;

        super({
            plugins: [
                x => new EnvironmentVariablesPlugin(x, { environmentVariables }),
                ...plugins
            ],
            ...rest
        });

        this._appRouterStore = createAppRouterStore(this._logger);
        this._honeycombInstrumentationClient = honeycombInstrumentationClient;
    }

    registerRoute(route: Route, options: RegisterRouteOptions = {}) {
        if (this.moduleManager.getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register a route once the modules are registered. Are you trying to register a route in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        super.registerRoute(route, options);
    }

    getMswState() {
        const plugin = getMswPlugin(this);

        return plugin.mswState;
    }

    registerRequestHandlers(handlers: RequestHandler[], options: RegisterRequestHandlersOptions = {}) {
        const logger = this._getLogger(options);
        const plugin = getMswPlugin(this);

        if (this.moduleManager.getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register an MSW request handlers once the modules are registered. Are you trying to register an MSW request handler in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        plugin.registerRequestHandlers(handlers, {
            logger
        });
    }

    // Must define a return type otherwise we get an "error TS2742: The inferred type of 'requestHandlers' cannot be named" error.
    get requestHandlers(): RequestHandler[] {
        const plugin = getMswPlugin(this);

        return plugin.requestHandlers;
    }

    get isMswEnabled() {
        return this._plugins.some(x => x.name === MswPluginName);
    }

    getVariable(key: EnvironmentVariablesKey) {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.getVariable(key);
    }

    getVariables() {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.getVariables();
    }

    registerVariable(key: EnvironmentVariablesKey, value: EnvironmentVariablesValue) {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.registerVariable(key, value);
    }

    registerVariables(variables: Partial<EnvironmentVariables>) {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.registerVariables(variables);
    }

    get appRouterStore() {
        return this._appRouterStore;
    }

    get honeycombInstrumentationClient() {
        return this._honeycombInstrumentationClient;
    }

    startScope(logger: Logger): TRuntime {
        return (new FireflyRuntimeScope(this, logger) as unknown) as TRuntime;
    }
}

export class FireflyRuntimeScope<TRuntime extends FireflyRuntime = FireflyRuntime> extends ReactRouterRuntimeScope<TRuntime> implements IFireflyRuntime {
    getMswState() {
        return this._runtime.getMswState();
    }

    registerRequestHandlers(handlers: RequestHandler[], options: RegisterRequestHandlersOptions = {}) {
        this._runtime.registerRequestHandlers(handlers, {
            ...options,
            logger: this._getLogger(options)
        });
    }

    // Must define a return type otherwise we get an "error TS2742: The inferred type of 'requestHandlers' cannot be named" error.
    get requestHandlers(): RequestHandler[] {
        return this._runtime.requestHandlers;
    }

    get isMswEnabled() {
        return this._runtime.isMswEnabled;
    }

    getVariables(): EnvironmentVariables {
        return this._runtime.getVariables();
    }

    getVariable(key: EnvironmentVariablesKey): EnvironmentVariablesValue {
        return this._runtime.getVariable(key);
    }

    registerVariable(): void {
        throw new Error("[squide] Cannot register an environment variable from a runtime scope instance.");
    }

    registerVariables() {
        throw new Error("[squide] Cannot register environment variables from a runtime scope instance.");
    }

    get appRouterStore(): AppRouterStore {
        throw new Error("[squide] Cannot retrieve the app router store from a runtime scope instance.");
    }

    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient {
        throw new Error("[squide] Cannot retrieve the Honeycomb instrumentation client from a runtime scope instance.");
    }
}
