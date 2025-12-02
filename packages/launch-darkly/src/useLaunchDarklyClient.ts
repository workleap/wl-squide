import { useRuntime } from "@squide/core";
import { getLaunchDarklyPlugin } from "./LaunchDarklyPlugin.ts";

export function useLaunchDarklyClient() {
    const runtime = useRuntime();
    const plugin = getLaunchDarklyPlugin(runtime);

    return plugin.client;
}
