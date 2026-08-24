import { toLocalModuleDefinitions, type ModuleRegisterFunction, type ModuleRegistrationError } from "@squide/core";
import { DeferredRegistrationsUpdatedEvent, type AppRouterWaitState } from "../AppRouterReducer.ts";
import type { FireflyRuntime } from "../FireflyRuntime.tsx";
import { DeferredRegistrationsUpdateCompletedEvent, DeferredRegistrationsUpdateStartedEvent } from "../useUpdateDeferredRegistrations.ts";

// At runtime this payload is the AppRouter wait state, which only exists once the AppRouter is rendered.
// A runner is headless, therefore there's nothing to wait for.
const HeadlessWaitState: AppRouterWaitState = {
    waitForMsw: false,
    waitForPublicData: false,
    waitForProtectedData: false
};

export interface DeferredRegistrationsRunner<TData = unknown> {
    register: (data?: TData) => Promise<ModuleRegistrationError[]>;
    update: (data?: TData) => Promise<ModuleRegistrationError[]>;
}

export interface CreateDeferredRegistrationsRunnerOptions<TContext = unknown> {
    context?: TContext;
}

export function createDeferredRegistrationsRunner<TRuntime extends FireflyRuntime = FireflyRuntime, TContext = unknown, TData = unknown>(
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

            // An update run is driven by the useUpdateDeferredRegistrations hook rather than by the module manager.
            // Modules, plugins and third-party libraries do listen to these events and read the app router store to
            // reset their per run state, therefore an update run that doesn't reproduce them doesn't reproduce what
            // happens in a real application.
            runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

            const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

            // Matching useEnhancedReducerDispatch, which updates the app router store and dispatches an event for
            // every action dispatched to the app router reducer.
            runtime.appRouterStore.dispatch({ type: "deferred-registrations-updated" });
            runtime.eventBus.dispatch(DeferredRegistrationsUpdatedEvent, HeadlessWaitState);

            runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

            return errors;
        }
    };
}
