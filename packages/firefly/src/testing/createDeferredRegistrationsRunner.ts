import { toLocalModuleDefinitions, type ModuleRegisterFunction, type ModuleRegistrationError } from "@squide/core";
import { DeferredRegistrationsUpdatedEvent, ModulesReadyEvent, ModulesRegisteredEvent, type AppRouterWaitState } from "../AppRouterReducer.ts";
import type { FireflyRuntime } from "../FireflyRuntime.tsx";
import { DeferredRegistrationsUpdateCompletedEvent, DeferredRegistrationsUpdateStartedEvent } from "../useUpdateDeferredRegistrations.ts";

// At runtime this payload is the AppRouter wait state, which only exists once the AppRouter is rendered.
// A runner is headless, therefore there's nothing to wait for, except for MSW which the AppRouter derives
// from the runtime rather than from its own state.
function createHeadlessWaitState(runtime: FireflyRuntime): AppRouterWaitState {
    return {
        waitForMsw: runtime.isMswEnabled,
        waitForPublicData: false,
        waitForProtectedData: false
    };
}

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

    // Matching useEnhancedReducerDispatch, which updates the app router store and dispatches an event for every
    // action dispatched to the app router reducer. Modules, plugins and third-party libraries such as the Platform
    // Widgets do listen to these events and read the store, therefore a run that doesn't reproduce them doesn't
    // reproduce what happens in a real application.
    const dispatchAppRouterAction = (type: "modules-registered" | "modules-ready" | "deferred-registrations-updated", eventName: typeof ModulesRegisteredEvent | typeof ModulesReadyEvent | typeof DeferredRegistrationsUpdatedEvent) => {
        runtime.appRouterStore.dispatch({ type });
        runtime.eventBus.dispatch(eventName, createHeadlessWaitState(runtime));
    };

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

            dispatchAppRouterAction("modules-registered", ModulesRegisteredEvent);

            const deferredRegistrationErrors = await runtime.moduleManager.registerDeferredRegistrations(data);

            dispatchAppRouterAction("modules-ready", ModulesReadyEvent);

            return [...registrationErrors, ...deferredRegistrationErrors];
        },
        async update(data?: TData) {
            if (!hasRegistered) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner must be called before the \"update\" function because an update run always follows a registration run.");
            }

            // An update run is driven by the useUpdateDeferredRegistrations hook rather than by the module manager.
            runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

            const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

            dispatchAppRouterAction("deferred-registrations-updated", DeferredRegistrationsUpdatedEvent);

            runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

            return errors;
        }
    };
}
