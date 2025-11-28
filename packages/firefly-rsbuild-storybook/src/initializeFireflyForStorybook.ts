import { EnvironmentVariables, EnvironmentVariablesPlugin } from "@squide/env-vars";
import { FireflyRuntime, ModuleRegisterFunction, toLocalModuleDefinitions } from "@squide/firefly";
import { MswPlugin } from "@squide/msw";
import { StorybookRuntime } from "./StorybookRuntime.ts";

export interface InitializeFireflyForStorybookOptions {
    localModules?: ModuleRegisterFunction<FireflyRuntime>[];
    environmentVariables?: EnvironmentVariables;
}

export async function initializeFireflyForStorybook(options: InitializeFireflyForStorybookOptions = {}) {
    const {
        localModules = [],
        environmentVariables = {}
    } = options;

    const runtime = new StorybookRuntime({
        mode: "development",
        plugins: [
            x => new MswPlugin(x),
            x => new EnvironmentVariablesPlugin(x, {
                variables: environmentVariables
            })
        ]
    });

    if (localModules.length > 0) {
        await runtime.moduleManager.registerModules([
            ...toLocalModuleDefinitions(localModules)
        ]);
    }

    return runtime;
}
