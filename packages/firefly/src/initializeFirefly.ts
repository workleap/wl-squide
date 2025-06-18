import { isFunction, registerLocalModules, type ModuleRegisterFunction, type RegisterModulesOptions } from "@squide/core";
import { registerRemoteModules, type RemoteDefinition } from "@squide/module-federation";
import { setMswAsReady } from "@squide/msw";
import { FireflyRuntime, type FireflyRuntimeOptions } from "./FireflyRuntime.tsx";
import { canRegisterHoneycombInstrumentation } from "./honeycomb/canRegisterHoneycombInstrumentation.ts";

export const ApplicationBootstrappingStartedEvent = "squide-app-bootstrapping-started";

export type OnInitializationErrorFunction = (error: unknown) => void;

export type StartMswFunction<TRuntime = FireflyRuntime> = (runtime: TRuntime) => Promise<void>;

export interface InitializeFireflyOptions<TRuntime extends FireflyRuntime, TContext = unknown, TData = unknown> extends RegisterModulesOptions<TContext>, FireflyRuntimeOptions {
    localModules?: ModuleRegisterFunction<TRuntime, TContext, TData>[];
    remotes?: RemoteDefinition[];
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
                    runtime.logger.debug("[squide] An error occured while starting MSW.", error);
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
        plugins
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

    if (canRegisterHoneycombInstrumentation()) {
        // import("./honeycomb/registerHoneycombInstrumentation.ts")
        // eslint-disable-next-line no-eval
        eval("import('./honeycomb/registerHoneycombInstrumentation.ts')")
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .then(module => {
                module.registerHoneycombInstrumentation(runtime);
            })
            .catch((error: unknown) => {
                if (options.onError) {
                    options.onError(error);
                }

                runtime.logger.error("[squide] Failed to register Honeycomb instrumentation. The \"./honeycomb/registerHoneycombInstrumentation.ts\" cannot be imported.");
            })
            .finally(() => {
                bootstrap(runtime, options);
            });
    } else {
        runtime.logger.debug("[squide] Cannot register Honeycomb instrumentation because the host application is not using the \"@workleap/honeycomb\" package.");
        // Bootstrap is called directly here when Honeycomb instrumentation is not enabled.
        bootstrap(runtime, options);
    }

    return runtime;
}

export function __resetHasExecuteGuard() {
    hasExecuted = false;
}
