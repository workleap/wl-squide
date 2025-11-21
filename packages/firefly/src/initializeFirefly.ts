import { isFunction, ModuleDefinition, toLocalModuleDefinitions, type ModuleRegisterFunction, type RegisterModulesOptions } from "@squide/core";
import { EnvironmentVariables, EnvironmentVariablesPlugin } from "@squide/env-vars";
import { MswPlugin } from "@squide/msw";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import { FireflyRuntime, type FireflyRuntimeOptions } from "./FireflyRuntime.tsx";
import { initializeHoneycomb } from "./honeycomb/initializeHoneycomb.ts";

export const ApplicationBootstrappingStartedEvent = "squide-app-bootstrapping-started";

export type OnInitializationErrorFunction = (error: unknown) => void;

export type StartMswFunction<TRuntime = FireflyRuntime> = (runtime: TRuntime) => Promise<void>;

export interface InitializeFireflyOptions<TRuntime extends FireflyRuntime, TContext = unknown, TData = unknown> extends RegisterModulesOptions<TContext>, FireflyRuntimeOptions {
    localModules?: ModuleRegisterFunction<TRuntime, TContext, TData>[];
    moduleDefinitions?: ModuleDefinition<TRuntime, TContext, TData>[];
    useMsw?: boolean;
    environmentVariables?: Partial<EnvironmentVariables>;
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
    startMsw?: StartMswFunction<FireflyRuntime>;
    onError?: OnInitializationErrorFunction;
}

export function bootstrap<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown>(
    runtime: TRuntime,
    modulesDefinitions: ModuleDefinition<TRuntime, TContext, TData>[],
    options: Omit<InitializeFireflyOptions<TRuntime, TContext, TData>, "localModules" | "moduleDefinitions"> = {}
) {
    const {
        startMsw,
        onError,
        context
    } = options;

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);

    runtime.moduleManager.registerModules(modulesDefinitions, { context })
        .then(results => {
            if (runtime.isMswEnabled) {
                if (!isFunction(startMsw)) {
                    throw new Error("[squide] When MSW is enabled, the \"startMsw\" function must be provided.");
                }

                startMsw(runtime)
                    .then(() => {
                        if (runtime.isMswEnabled) {
                            runtime.getMswState().setAsReady();
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
        plugins = [],
        environmentVariables,
        honeycombInstrumentationClient,
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

    const runtime = new FireflyRuntime({
        mode,
        honeycombInstrumentationClient,
        loggers,
        plugins: [
            x => new EnvironmentVariablesPlugin(x, {
                environmentVariables
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
