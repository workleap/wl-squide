import { isFunction, registerLocalModules, type ModuleRegisterFunction, type ModuleRegistrationError, type RegisterModulesOptions } from "@squide/core";
import { registerRemoteModules, type RemoteDefinition, type RemoteModuleRegistrationError } from "@squide/module-federation";
import { setMswAsReady } from "@squide/msw";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";

export const ApplicationBootstrappingStartedEvent = "squide-app-bootstrapping-started";

export type StartMswFunction<TRuntime = FireflyRuntime> = (runtime: TRuntime) => Promise<void>;

export interface BootstrapAppOptions<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown> extends RegisterModulesOptions<TContext> {
    localModules?: ModuleRegisterFunction<TRuntime, TContext, TData>[];
    remotes?: RemoteDefinition[];
    startMsw?: StartMswFunction<TRuntime>;
}

let hasExecuted = false;

export async function bootstrap<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown>(runtime: TRuntime, options: BootstrapAppOptions<TRuntime, TContext, TData> = {}) {
    const {
        localModules = [],
        remotes = [],
        context,
        startMsw
    } = options;

    if (hasExecuted) {
        throw new Error("[squide] A squide application can only be bootstrapped once. Did you call the \"bootstrap\" function twice?");
    }

    hasExecuted = true;

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);

    let localModuleErrors: ModuleRegistrationError[] = [];
    let remoteModuleErrors: RemoteModuleRegistrationError[] = [];

    localModuleErrors = await registerLocalModules<TRuntime, TContext, TData>(localModules, runtime, { context });
    remoteModuleErrors = await registerRemoteModules(remotes, runtime, { context });

    if (runtime.isMswEnabled) {
        if (!isFunction(startMsw)) {
            throw new Error("[squide] When MSW is enabled, the \"startMsw\" function must be provided.");
        }

        try {
            await startMsw(runtime);

            setMswAsReady();
        } catch (error: unknown) {
            runtime.logger.debug("[squide] An error occured while starting MSW.", error);
        }
    }

    return {
        localModuleErrors,
        remoteModuleErrors
    };
}

export function __resetHasExecuteGuard() {
    hasExecuted = false;
}
