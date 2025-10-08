import { isFunction, registerLocalModules, type ModuleRegisterFunction, type RegisterModulesOptions } from "@squide/core";
import { registerRemoteModules, type RemoteDefinition } from "@squide/module-federation";
import { setMswAsReady } from "@squide/msw";
import type { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import { FireflyRuntime, type FireflyRuntimeOptions } from "./FireflyRuntime.tsx";
import { initializeHoneycomb } from "./honeycomb/initializeHoneycomb.ts";

export const ApplicationBootstrappingStartedEvent = "squide-app-bootstrapping-started";

export type OnInitializationErrorFunction = (error: unknown) => void;

export type StartMswFunction<TRuntime = FireflyRuntime> = (runtime: TRuntime) => Promise<void>;

export interface InitializeFireflyOptions<TRuntime extends FireflyRuntime, TContext = unknown, TData = unknown> extends RegisterModulesOptions<TContext>, FireflyRuntimeOptions {
    localModules?: ModuleRegisterFunction<TRuntime, TContext, TData>[];
    remotes?: RemoteDefinition[];
    honeycombInstrumentationClient?: HoneycombInstrumentationPartialClient;
    startMsw?: StartMswFunction<FireflyRuntime>;
    onError?: OnInitializationErrorFunction;
}

function propagateRegistrationErrors(results: PromiseSettledResult<unknown[]>, onError: OnInitializationErrorFunction) {
    if (results) {
        if (results.status === "fulfilled") {
            results.value.forEach(x => {
                onError(x);
            });
        }
    }
}

export function bootstrap<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown>(runtime: TRuntime, options: InitializeFireflyOptions<TRuntime, TContext, TData> = {}) {
    const {
        localModules = [],
        remotes = [],
        startMsw,
        onError,
        context
    } = options;

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);

    Promise.allSettled([
        registerLocalModules<TRuntime, TContext, TData>(localModules, runtime, { context }),
        registerRemoteModules(remotes, runtime, { context })
    ]).then(results => {
        if (runtime.isMswEnabled) {
            if (!isFunction(startMsw)) {
                throw new Error("[squide] When MSW is enabled, the \"startMsw\" function must be provided.");
            }

            startMsw(runtime)
                .then(() => {
                    setMswAsReady();
                })
                .catch((error: unknown) => {
                    runtime.logger
                        .withText("[squide] An error occured while starting MSW.")
                        .withError(error as Error)
                        .error();
                });
        }

        if (onError) {
            propagateRegistrationErrors(results[0], onError);
            propagateRegistrationErrors(results[1], onError);
        }
    });
}

let hasExecuted = false;

export function initializeFirefly<TContext = unknown, TData = unknown>(options: InitializeFireflyOptions<FireflyRuntime, TContext, TData> = {}) {
    const {
        mode,
        useMsw,
        loggers,
        plugins,
        honeycombInstrumentationClient,
        onError
    } = options;

    if (hasExecuted) {
        throw new Error("[squide] A squide application can only be initialized once. Did you call the \"initializeSquide\" function twice?");
    }

    hasExecuted = true;

    const runtime = new FireflyRuntime({
        mode,
        useMsw,
        loggers,
        plugins
    });

    initializeHoneycomb(runtime, honeycombInstrumentationClient)
        .catch((error: unknown) => {
            if (onError) {
                onError(error);
            }
        })
        .finally(() => {
            bootstrap(runtime, options);
        });

    return runtime;
}

export function __resetHasExecuteGuard() {
    hasExecuted = false;
}
