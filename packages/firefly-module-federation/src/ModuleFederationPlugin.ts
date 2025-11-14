import { loadRemote as loadModuleFederationRemote } from "@module-federation/enhanced/runtime";
import { Plugin, RegisterModulesOptions, isNil, type Runtime } from "@squide/core";
import { RemoteDefinition } from "./RemoteDefinition.ts";
import { RemoteModuleRegistry, RemoteModuleRegistryId } from "./RemoteModuleRegistry.ts";

export const ModuleFederationPluginName = "module-federation-plugin";

export class ModuleFederationPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(ModuleFederationPluginName, runtime);

        this._runtime.moduleManager.addModuleRegistry(new RemoteModuleRegistry((remoteName, moduleName) => loadModuleFederationRemote(`${remoteName}/${moduleName}`)));
    }

    registerRemoteModules<TContext = unknown>(remotes: RemoteDefinition[], options?: RegisterModulesOptions<TContext>) {
        return this._runtime.moduleManager.registerModules(remotes.map(x => ({
            definition: x,
            registryId: RemoteModuleRegistryId
        })), options);
    }
}

export function getModuleFederationPlugin(runtime: Runtime) {
    const plugin = runtime.getPlugin(ModuleFederationPluginName);

    if (isNil(plugin)) {
        throw new Error("[squide] The getModuleFederationPlugin function is called but no ModuleFederationPlugin instance has been registered with the runtime.");
    }

    return plugin as ModuleFederationPlugin;
}
