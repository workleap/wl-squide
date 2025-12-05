import { EnvironmentVariables, EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyRuntime, InMemoryLaunchDarklyClient, LaunchDarklyPlugin, ModuleRegisterFunction, toLocalModuleDefinitions } from "@squide/firefly";
import { MswPlugin } from "@squide/msw";
import { LDClient, LDFlagValue } from "launchdarkly-js-client-sdk";
import { StorybookRuntime } from "./StorybookRuntime.ts";

export interface InitializeFireflyForStorybookOptions {
    localModules?: ModuleRegisterFunction<FireflyRuntime>[];
    environmentVariables?: EnvironmentVariables;
    featureFlags?: Map<string, LDFlagValue> | Record<string, LDFlagValue>;
    launchDarklyClient?: LDClient;
}

export async function initializeFireflyForStorybook(options: InitializeFireflyForStorybookOptions = {}) {
    const {
        localModules,
        environmentVariables,
        featureFlags = {},
        launchDarklyClient
    } = options;

    const runtime = new StorybookRuntime({
        mode: "development",
        plugins: [
            x => new MswPlugin(x),
            x => new EnvironmentVariablesPlugin(x, {
                variables: environmentVariables
            }),
            x => new LaunchDarklyPlugin(
                x,
                // 1- If no client is provided create it.
                // 2- If feature flags are provided and it's an instance of Map, use the argument.
                // 3- If feature flags are provided (or the default value) and it's an object literal, convert the object to a Map instance.
                launchDarklyClient ?? new InMemoryLaunchDarklyClient(featureFlags instanceof Map
                    ? featureFlags
                    : new Map<string, LDFlagValue>(Object.entries(featureFlags))
                )
            )
        ]
    });

    if (localModules && localModules.length > 0) {
        await runtime.moduleManager.registerModules([
            ...toLocalModuleDefinitions(localModules)
        ]);
    }

    return runtime;
}
