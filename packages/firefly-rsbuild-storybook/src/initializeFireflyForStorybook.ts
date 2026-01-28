import { EnvironmentVariables, EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyRuntime, InMemoryLaunchDarklyClient, LaunchDarklyPlugin, ModuleRegisterFunction, PluginFactory, toLocalModuleDefinitions } from "@squide/firefly";
import { FeatureFlags } from "@squide/launch-darkly";
import { MswPlugin } from "@squide/msw";
import { RootLogger } from "@workleap/logging";
import { LDClient } from "launchdarkly-js-client-sdk";
import { StorybookRuntime } from "./StorybookRuntime.ts";

export interface InitializeFireflyForStorybookOptions {
    localModules?: ModuleRegisterFunction<FireflyRuntime>[];
    environmentVariables?: EnvironmentVariables;
    featureFlags?: Partial<FeatureFlags>;
    launchDarklyClient?: LDClient;
    loggers?: RootLogger[];
}

function logInitializationState(
    runtime: FireflyRuntime,
    options: InitializeFireflyForStorybookOptions,
    plugins: PluginFactory<FireflyRuntime>[]
) {
    const {
        localModules,
        environmentVariables,
        featureFlags,
        launchDarklyClient
    } = options;
    const scope = (runtime.logger as RootLogger).startScope("[squide] Initializing the application.");

    try {
        scope.information("[squide] Mode: development");

        if (localModules) {
            scope
                .withText("[squide] Local modules:")
                .withObject(localModules)
                .information();
        }

        scope.information("[squide] Use MSW: Yes");

        if (environmentVariables && Object.keys(environmentVariables).length > 0) {
            scope
                .withText("[squide] Environment variables:")
                .withObject(environmentVariables)
                .information();
        }

        if (featureFlags) {
            scope
                .withText("[squide] Feature flags:")
                .withObject(featureFlags)
                .information();
        }

        if (launchDarklyClient) {
            scope
                .withText("[squide] LaunchDarkly client:")
                .withObject(launchDarklyClient)
                .information();
        }

        if (plugins.length > 0) {
            scope
                .withText("[squide] Plugins:")
                .withObject(plugins)
                .information();
        }
    } finally {
        scope.end();
    }
}

export async function initializeFireflyForStorybook(options: InitializeFireflyForStorybookOptions = {}) {
    const {
        localModules,
        environmentVariables,
        featureFlags = {},
        launchDarklyClient,
        loggers
    } = options;

    const plugins: PluginFactory<FireflyRuntime>[] = [
        x => new MswPlugin(x),
        x => new EnvironmentVariablesPlugin(x, {
            variables: environmentVariables
        }),
        x => new LaunchDarklyPlugin(x, launchDarklyClient ?? new InMemoryLaunchDarklyClient(featureFlags))
    ];

    const runtime = new StorybookRuntime({
        mode: "development",
        plugins,
        loggers
    });

    logInitializationState(runtime, options, plugins);

    if (localModules && localModules.length > 0) {
        await runtime.moduleManager.registerModules([
            ...toLocalModuleDefinitions(localModules)
        ]);
    }

    return runtime;
}
