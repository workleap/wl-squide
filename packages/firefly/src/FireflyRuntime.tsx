import type { RegisterRouteOptions, RuntimeMethodOptions, RuntimeOptions } from "@squide/core";
import { EnvironmentVariableKey, EnvironmentVariables, getEnvironmentVariablesPlugin } from "@squide/env-vars";
import { FeatureFlagKey, FeatureFlags, FeatureFlagSetSnapshot, getLaunchDarklyPlugin, LaunchDarklyPluginName } from "@squide/launch-darkly";
import { getMswPlugin, MswPluginName, MswState } from "@squide/msw";
import { type IReactRouterRuntime, ReactRouterRuntime, ReactRouterRuntimeScope, type Route } from "@squide/react-router";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import type { Logger } from "@workleap/logging";
import { LDClient } from "launchdarkly-js-client-sdk";
import type { RequestHandler } from "msw";
import { type AppRouterStore, createAppRouterStore } from "./AppRouterStore.ts";

export interface FireflyRuntimeOptions<TRuntime extends FireflyRuntime = FireflyRuntime> extends RuntimeOptions<TRuntime> {
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
}

export interface RegisterRequestHandlersOptions extends RuntimeMethodOptions {}

export interface IFireflyRuntime extends IReactRouterRuntime {
    get isMswEnabled(): boolean;
    get mswState(): MswState;
    registerRequestHandlers: (handlers: RequestHandler[]) => void;
    get requestHandlers(): RequestHandler[];
    registerEnvironmentVariable<T extends EnvironmentVariableKey>(key: T, value: EnvironmentVariables[T]): void;
    registerEnvironmentVariables(variables: Partial<EnvironmentVariables>): void;
    getEnvironmentVariable<T extends EnvironmentVariableKey>(key: T): EnvironmentVariables[T];
    get environmentVariables(): EnvironmentVariables;
    get appRouterStore(): AppRouterStore;
    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient | undefined;
    get isLaunchDarklyEnabled(): boolean;
    get launchDarklyClient(): LDClient;
    get featureFlags(): FeatureFlags;
    getFeatureFlag(key: string, defaultValue?: unknown): unknown;
    get featureFlagSetSnapshot(): FeatureFlagSetSnapshot;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FireflyRuntime<TRuntime extends FireflyRuntime = any> extends ReactRouterRuntime<TRuntime> implements IFireflyRuntime {
    readonly #appRouterStore: AppRouterStore;
    readonly #honeycombInstrumentationClient: HoneycombInstrumentationPartialClient | undefined;
    readonly #isMswEnabled: boolean;
    readonly #isLaunchDarklyEnabled: boolean;

    constructor(options: FireflyRuntimeOptions = {}) {
        const {
            honeycombInstrumentationClient
        } = options;

        super(options);

        this.#appRouterStore = createAppRouterStore(this._logger);
        this.#honeycombInstrumentationClient = honeycombInstrumentationClient;
        this.#isMswEnabled = this._plugins.some(x => x.name === MswPluginName);
        this.#isLaunchDarklyEnabled = this._plugins.some(x => x.name === LaunchDarklyPluginName);
    }

    registerRoute(route: Route, options: RegisterRouteOptions = {}) {
        if (this.moduleManager.getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register a route once the modules are registered. Are you trying to register a route in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        super.registerRoute(route, options);
    }

    get isMswEnabled() {
        return this.#isMswEnabled;
    }

    get mswState() {
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

    getEnvironmentVariable(key: EnvironmentVariableKey) {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.getVariable(key);
    }

    get environmentVariables() {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.getVariables();
    }

    registerEnvironmentVariable<T extends EnvironmentVariableKey>(key: T, value: EnvironmentVariables[T]) {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.registerVariable(key, value);
    }

    registerEnvironmentVariables(variables: Partial<EnvironmentVariables>) {
        const plugin = getEnvironmentVariablesPlugin(this);

        return plugin.registerVariables(variables);
    }

    get appRouterStore() {
        return this.#appRouterStore;
    }

    get honeycombInstrumentationClient() {
        return this.#honeycombInstrumentationClient;
    }

    get isLaunchDarklyEnabled() {
        return this.#isLaunchDarklyEnabled;
    }

    get launchDarklyClient() {
        return getLaunchDarklyPlugin(this).client;
    }

    get featureFlags() {
        return this.featureFlagSetSnapshot.value;
    }

    getFeatureFlag<T extends FeatureFlagKey>(key: T, defaultValue?: FeatureFlags[T]) {
        return getLaunchDarklyPlugin(this).getFeatureFlag(key, defaultValue);
    }

    get featureFlagSetSnapshot() {
        return getLaunchDarklyPlugin(this).featureFlagSetSnapshot;
    }

    startScope(logger: Logger): TRuntime {
        return (new FireflyRuntimeScope(this, logger) as unknown) as TRuntime;
    }
}

export class FireflyRuntimeScope<TRuntime extends FireflyRuntime = FireflyRuntime> extends ReactRouterRuntimeScope<TRuntime> implements IFireflyRuntime {
    get isMswEnabled() {
        return this._runtime.isMswEnabled;
    }

    get mswState() {
        return this._runtime.mswState;
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

    getEnvironmentVariable(key: EnvironmentVariableKey) {
        return this._runtime.getEnvironmentVariable(key);
    }

    get environmentVariables() {
        return this._runtime.environmentVariables;
    }

    registerEnvironmentVariable<T extends EnvironmentVariableKey>(key: T, value: EnvironmentVariables[T]) {
        this._runtime.registerEnvironmentVariable(key, value);
    }

    registerEnvironmentVariables(variables: Partial<EnvironmentVariables>) {
        this._runtime.registerEnvironmentVariables(variables);
    }

    get appRouterStore(): AppRouterStore {
        throw new Error("[squide] Cannot retrieve the app router store from a runtime scope instance.");
    }

    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient {
        throw new Error("[squide] Cannot retrieve the Honeycomb instrumentation client from a runtime scope instance.");
    }

    get isLaunchDarklyEnabled() {
        return this._runtime.isLaunchDarklyEnabled;
    }

    get launchDarklyClient() {
        return this._runtime.launchDarklyClient;
    }

    get featureFlags() {
        return this._runtime.featureFlags;
    }

    getFeatureFlag<T extends FeatureFlagKey>(key: T, defaultValue?: FeatureFlags[T]) {
        // The error is because the FeatureFlags interface is empty as it is expected to be augmented by the
        // consumer application.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this._runtime.getFeatureFlag(key, defaultValue);
    }

    get featureFlagSetSnapshot() {
        return this._runtime.featureFlagSetSnapshot;
    }
}
