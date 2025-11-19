import { FireflyRuntime, initializeFirefly as baseInitializeFirefly, type InitializeFireflyOptions as BaseInitializeFireflyOptions } from "@squide/firefly";
import { ModuleFederationPlugin } from "./ModuleFederationPlugin.ts";
import { RemoteDefinition } from "./RemoteDefinition.ts";
import { toRemoteModuleDefinitions } from "./RemoteModuleRegistry.ts";

export interface InitializeFireflyOptions<TRuntime extends FireflyRuntime, TContext = unknown, TData = unknown> extends BaseInitializeFireflyOptions<TRuntime, TContext, TData> {
    remotes?: RemoteDefinition[];
}

export function initializeFirefly<TContext = unknown, TData = unknown>(options: InitializeFireflyOptions<FireflyRuntime, TContext, TData> = {}) {
    const {
        remotes = [],
        moduleDefinitions = [],
        plugins = [],
        ...rest
    } = options;

    return baseInitializeFirefly({
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
