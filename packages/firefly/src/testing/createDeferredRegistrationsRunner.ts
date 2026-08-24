import { toLocalModuleDefinitions, type ModuleRegisterFunction, type ModuleRegistrationError, type Runtime } from "@squide/core";
import { DeferredRegistrationsUpdateCompletedEvent, DeferredRegistrationsUpdateStartedEvent } from "../useUpdateDeferredRegistrations.ts";

export interface DeferredRegistrationsRunner<TData = unknown> {
    register: (data?: TData) => Promise<ModuleRegistrationError[]>;
    update: (data?: TData) => Promise<ModuleRegistrationError[]>;
}

export interface CreateDeferredRegistrationsRunnerOptions<TContext = unknown> {
    context?: TContext;
}

export function createDeferredRegistrationsRunner<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(
    runtime: TRuntime,
    localModules: ModuleRegisterFunction<TRuntime, TContext, TData>[],
    options: CreateDeferredRegistrationsRunnerOptions<TContext> = {}
): DeferredRegistrationsRunner<TData> {
    const {
        context
    } = options;

    let hasRegistered = false;

    return {
        async register(data?: TData) {
            if (hasRegistered) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner can only be called once. Did you mean to call the \"update\" function?");
            }

            hasRegistered = true;

            const registrationErrors = await runtime.moduleManager.registerModules<TRuntime, TContext, TData>(
                toLocalModuleDefinitions<TRuntime, TContext, TData>(localModules),
                { context }
            );

            const deferredRegistrationErrors = await runtime.moduleManager.registerDeferredRegistrations(data);

            return [...registrationErrors, ...deferredRegistrationErrors];
        },
        async update(data?: TData) {
            if (!hasRegistered) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner must be called before the \"update\" function because an update run always follows a registration run.");
            }

            // These events are dispatched by the useUpdateDeferredRegistrations hook rather than by the module manager.
            // Modules do listen to them to reset per run state, therefore an update run that doesn't dispatch them
            // doesn't reproduce what happens in a real application.
            runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

            const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

            runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

            return errors;
        }
    };
}
