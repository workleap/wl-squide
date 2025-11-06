import { isNil, Plugin, type Runtime } from "@squide/core";
import { type EnvironmentVariables, EnvironmentVariablesRegistry, type EnvironmentVariablesRegistryKey, type EnvironmentVariablesRegistryValue } from "./EnvironmentVariablesRegistry.ts";

export const EnvironmentVariablesPluginName = "env-vars-plugin";

export interface EnvironmentVariablesPluginOptions {
    environmentVariables?: Partial<EnvironmentVariables>;
};

export class EnvironmentVariablesPlugin extends Plugin {
    readonly #environmentVariablesRegistry = new EnvironmentVariablesRegistry();

    constructor(runtime: Runtime, options: EnvironmentVariablesPluginOptions = {}) {
        super(EnvironmentVariablesPluginName, runtime);

        const {
            environmentVariables
        } = options;

        if (environmentVariables) {
            this.#environmentVariablesRegistry.addVariables(environmentVariables);
        }
    }

    registerVariable(key: EnvironmentVariablesRegistryKey, value: EnvironmentVariablesRegistryValue) {
        this.#environmentVariablesRegistry.add(key, value);

        this._runtime.logger.debug(`[squide] An environment variable for key "${key}" has been registered with the value "${value}".`);
    }

    registerVariables(variables: Partial<EnvironmentVariables>) {
        this.#environmentVariablesRegistry.addVariables(variables);

        this._runtime.logger
            .withText("[squide] The following environment variables has been registered:")
            .withObject(variables)
            .debug();
    }

    getVariable(key: EnvironmentVariablesRegistryKey) {
        return this.#environmentVariablesRegistry.getVariable(key);
    }

    getVariables() {
        return this.#environmentVariablesRegistry.getVariables();
    }
}

export function getEnvironmentVariablesPlugin(runtime: Runtime) {
    const plugin = runtime.getPlugin(EnvironmentVariablesPluginName);

    if (isNil(plugin)) {
        throw new Error("[squide] The getEnvironmentVariablesPlugin function is called but no EnvironmentVariablesPlugin instance has been registered with the runtime.");
    }

    return plugin as EnvironmentVariablesPlugin;
}
