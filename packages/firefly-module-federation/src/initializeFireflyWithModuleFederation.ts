import { FireflyRuntime, initializeFirefly, type InitializeFireflyOptions } from "@squide/firefly";
import { ModuleFederationPlugin } from "./ModuleFederationPlugin.ts";
import { RemoteDefinition } from "./RemoteDefinition.ts";
import { toRemoteModuleDefinitions } from "./RemoteModuleRegistry.ts";

export interface InitializeFireflyWithModuleFederationOptions<TRuntime extends FireflyRuntime, TContext = unknown, TData = unknown> extends InitializeFireflyOptions<TRuntime, TContext, TData> {
    remotes?: RemoteDefinition[];
}

export function initializeFireflyWithModuleFederation<TContext = unknown, TData = unknown>(options: InitializeFireflyWithModuleFederationOptions<FireflyRuntime, TContext, TData> = {}) {
    const {
        remotes = [],
        moduleDefinitions = [],
        plugins = [],
        ...rest
    } = options;

    return initializeFirefly({
        moduleDefinitions: [
            ...moduleDefinitions,
            ...toRemoteModuleDefinitions(remotes)
        ],
        plugins: [
            x => new ModuleFederationPlugin(x),
            ...plugins
        ],
        ...rest
    });
}
