import type { RegisterRouteOptions, RuntimeOptions } from "@squide/core";
import { MswPlugin, MswPluginName } from "@squide/msw";
import { ReactRouterRuntime, type Route } from "@squide/react-router";
import type { RequestHandler } from "msw";
import { getAreModulesRegistered } from "./AppRouterReducer.ts";
import { type AppRouterStore, createAppRouterStore } from "./AppRouterStore.ts";

export interface FireflyRuntimeOptions extends RuntimeOptions {
    useMsw?: boolean;
}

export class FireflyRuntime extends ReactRouterRuntime {
    readonly #appRouterStore: AppRouterStore;
    readonly #useMsw: boolean;

    constructor({ plugins, useMsw, ...options }: FireflyRuntimeOptions = {}) {
        if (useMsw) {
            super({
                plugins: [
                    ...(plugins ?? []),
                    runtime => new MswPlugin(runtime)
                ],
                ...options
            });

            this.#useMsw = true;
        } else {
            super({
                plugins,
                ...options
            });

            this.#useMsw = false;
        }

        this.#appRouterStore = createAppRouterStore(this._logger);
    }

    registerRequestHandlers(handlers: RequestHandler[]) {
        const mswPlugin = this.getPlugin(MswPluginName) as MswPlugin;

        if (!mswPlugin) {
            throw new Error("[squide] Cannot register the provided MSW request handlers because the runtime hasn't been initialized with MSW. Did you instanciate the FireflyRuntime with the \"useMsw\" option?");
        }

        if (getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register an MSW request handlers once the modules are registered. Are you trying to register an MSW request handler in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        mswPlugin.registerRequestHandlers(handlers);
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
        if (getAreModulesRegistered()) {
            throw new Error("[squide] Cannot register a route once the modules are registered. Are you trying to register a route in a deferred registration function? Only navigation items can be registered in a deferred registration function.");
        }

        super.registerRoute(route, options);
    }

    get appRouterStore() {
        return this.#appRouterStore;
    }

    get isMswEnabled() {
        return this.#useMsw;
    }
}
