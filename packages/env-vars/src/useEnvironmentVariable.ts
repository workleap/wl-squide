import { useRuntime } from "@squide/core";
import { getEnvironmentVariablesPlugin } from "./EnvironmentVariablesPlugin.ts";
import type { EnvironmentVariableKey } from "./EnvironmentVariablesRegistry.ts";

export function useEnvironmentVariable<T extends EnvironmentVariableKey>(key: T) {
    const runtime = useRuntime();
    const plugin = getEnvironmentVariablesPlugin(runtime);

    return plugin.getVariable(key);
}

export function useEnvironmentVariables() {
    const runtime = useRuntime();
    const plugin = getEnvironmentVariablesPlugin(runtime);

    return plugin.getVariables();
}
