import { ModuleDefinition, toLocalModuleDefinitions, type ModuleRegisterFunction, type RegisterModulesOptions } from "@squide/core";
import { isFunction } from "@squide/core/internal";
import { EnvironmentVariables, EnvironmentVariablesPlugin } from "@squide/env-vars";
import { LaunchDarklyPlugin } from "@squide/launch-darkly";
import { MswPlugin } from "@squide/msw";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import { LDClient } from "launchdarkly-js-client-sdk";
import { FireflyRuntime, type FireflyRuntimeOptions } from "./FireflyRuntime.tsx";
import { initializeHoneycomb } from "./honeycomb/initializeHoneycomb.ts";

export const ApplicationBootstrappingStartedEvent = "squide-app-bootstrapping-started";

export type OnInitializationErrorFunction = (error: unknown) => void;

export type StartMswFunction<TRuntime = FireflyRuntime> = (runtime: TRuntime) => Promise<void>;

export interface InitializeFireflyOptions<TRuntime extends FireflyRuntime, TContext = unknown, TData = unknown> extends RegisterModulesOptions<TContext>, FireflyRuntimeOptions {
    localModules?: (ModuleRegisterFunction<TRuntime, TContext, TData> | undefined)[];
    moduleDefinitions?: ModuleDefinition<TRuntime, TContext, TData>[];
    useMsw?: boolean;
    environmentVariables?: Partial<EnvironmentVariables>;
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
    launchDarklyClient?: LDClient;
    startMsw?: StartMswFunction<FireflyRuntime>;
    onError?: OnInitializationErrorFunction;
}

export function bootstrap<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown>(
    runtime: TRuntime,
    modulesDefinitions: (ModuleDefinition<TRuntime, TContext, TData> | undefined)[],
    options: Omit<InitializeFireflyOptions<TRuntime, TContext, TData>, "localModules" | "moduleDefinitions"> = {}
) {
    const {
        startMsw,
        onError,
        context
    } = options;

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);

    runtime.moduleManager.registerModules(
        modulesDefinitions.filter((x): x is ModuleDefinition => Boolean(x)),
        { context }
    ).then(results => {
        if (runtime.isMswEnabled) {
            if (!isFunction(startMsw)) {
                throw new Error("[squide] When MSW is enabled, the \"startMsw\" function must be provided.");
            }

            startMsw(runtime)
                .then(() => {
                    if (runtime.isMswEnabled) {
                        runtime.mswState.setAsReady();
                    }
                })
                .catch((error: unknown) => {
                    runtime.logger
                        .withText("[squide] An error occured while starting MSW.")
                        .withError(error as Error)
                        .error();
                });
        }

        if (onError) {
            results.forEach(error => {
                onError(error);
            });
        }
    });
}

let hasExecuted = false;

// Should only be used by tests.
export function __resetHasExecutedGuard() {
    hasExecuted = false;
}

export function initializeFirefly<TContext = unknown, TData = unknown>(options: InitializeFireflyOptions<FireflyRuntime, TContext, TData> = {}) {
    const {
        mode,
        localModules = [],
        moduleDefinitions = [],
        useMsw,
        environmentVariables,
        honeycombInstrumentationClient,
        launchDarklyClient,
        plugins = [],
        loggers,
        onError
    } = options;

    if (hasExecuted) {
        throw new Error("[squide] A squide application can only be initialized once. Did you call the \"initializeSquide\" function twice?");
    }

    hasExecuted = true;

    if (useMsw) {
        plugins.push(x => new MswPlugin(x));
    }

    if (launchDarklyClient) {
        plugins.push(x => new LaunchDarklyPlugin(x, launchDarklyClient));
    }

    loggers?.forEach(x => {
        const scope = x.startScope("[squide] Initializing the application.");

        try {
            scope.information(`[squide] Mode: ${mode ?? "development"}`);

            if (localModules.length > 0) {
                scope
                    .withText("[squide] Local modules:")
                    .withObject(localModules)
                    .information();
            }

            if (moduleDefinitions.length > 0) {
                scope
                    .withText("[squide] Module definitions:")
                    .withObject(moduleDefinitions)
                    .information();
            }

            scope.information(`[squide] Use MSW: ${useMsw ? "Yes" : "No"}`);

            if (environmentVariables && Object.keys(environmentVariables).length > 0) {
                scope
                    .withText("[squide] Environment variables:")
                    .withObject(environmentVariables)
                    .information();
            }

            if (honeycombInstrumentationClient) {
                scope
                    .withText("[squide] Honeycomb instrumentation client:")
                    .withObject(honeycombInstrumentationClient)
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
    });

    const runtime = new FireflyRuntime({
        mode,
        honeycombInstrumentationClient,
        loggers,
        plugins: [
            x => new EnvironmentVariablesPlugin(x, {
                variables: environmentVariables
            }),
            ...plugins
        ]
    });

    initializeHoneycomb(runtime)
        .catch((error: unknown) => {
            if (onError) {
                onError(error);
            }
        })
        .finally(() => {
            bootstrap(
                runtime,
                [...moduleDefinitions, ...toLocalModuleDefinitions(localModules)],
                options
            );
        });

    return runtime;
}
