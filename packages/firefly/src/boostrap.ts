import { isFunction, registerLocalModules, type ModuleRegisterFunction, type RegisterModulesOptions } from "@squide/core";
import { registerRemoteModules, type RemoteDefinition } from "@squide/module-federation";
import { setMswAsReady } from "@squide/msw";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";

export const ApplicationBootstrappingStartedEvent = "squide-app-bootstrapping-started";

export type StartMswFunction<TRuntime = FireflyRuntime> = (runtime: TRuntime) => Promise<void>;

export type OnBootstrapErrorFunction = (error: unknown) => void;

export interface BootstrapAppOptions<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown> extends RegisterModulesOptions<TContext> {
    localModules?: ModuleRegisterFunction<TRuntime, TContext, TData>[];
    remotes?: RemoteDefinition[];
    startMsw?: StartMswFunction<TRuntime>;
    onError?: OnBootstrapErrorFunction;
}

function propagateRegistrationErrors(results: PromiseSettledResult<unknown[]>, onError: OnBootstrapErrorFunction) {
    if (results) {
        if (results.status === "fulfilled") {
            results.value.forEach(x => {
                onError(x);
            });
        }
    }
}

let hasExecuted = false;

export function bootstrap<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown>(runtime: TRuntime, options: BootstrapAppOptions<TRuntime, TContext, TData> = {}) {
    const {
        localModules = [],
        remotes = [],
        context,
        startMsw,
        onError
    } = options;

    if (hasExecuted) {
        throw new Error("[squide] A squide application can only be bootstrapped once. Did you call the \"bootstrap\" function twice?");
    }

    hasExecuted = true;

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);

    Promise.allSettled([
        registerLocalModules<TRuntime, TContext, TData>(localModules, runtime, { context }),
        registerRemoteModules(remotes, runtime, { context })
    ]).then(results => {
        if (onError) {
            propagateRegistrationErrors(results[0], onError);
            propagateRegistrationErrors(results[1], onError);
        }

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
    });
}

export function __resetHasExecuteGuard() {
    hasExecuted = false;
}
