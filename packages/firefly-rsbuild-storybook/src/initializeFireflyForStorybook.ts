import { EnvironmentVariables, EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyRuntime, InMemoryLaunchDarklyClient, LaunchDarklyPlugin, ModuleRegisterFunction, toLocalModuleDefinitions } from "@squide/firefly";
import { MswPlugin } from "@squide/msw";
import { LDClient, LDFlagSet } from "launchdarkly-js-client-sdk";
import { StorybookRuntime } from "./StorybookRuntime.ts";

export interface InitializeFireflyForStorybookOptions {
    localModules?: ModuleRegisterFunction<FireflyRuntime>[];
    environmentVariables?: EnvironmentVariables;
    featureFlags?: LDFlagSet;
    launchDarklyClient?: LDClient;
}

export async function initializeFireflyForStorybook(options: InitializeFireflyForStorybookOptions = {}) {
    const {
        localModules,
        environmentVariables,
        featureFlags,
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
                launchDarklyClient ?? new InMemoryLaunchDarklyClient(featureFlags ?? {})
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
