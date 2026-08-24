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

    // Keeping the promise rather than a boolean so that an update cannot race a registration run that hasn't
    // been awaited, which would otherwise fail deep inside the module registries with an unrelated message.
    let registerPromise: Promise<ModuleRegistrationError[]> | undefined;

    // Matching useEnhancedReducerDispatch, which updates the app router store and dispatches an event for every
    // action dispatched to the app router reducer. Modules, plugins and third-party libraries such as the Platform
    // Widgets do listen to these events and read the store, therefore a run that doesn't reproduce them doesn't
    // reproduce what happens in a real application.
    const dispatchAppRouterAction = (type: "modules-registered" | "modules-ready" | "deferred-registrations-updated", eventName: typeof ModulesRegisteredEvent | typeof ModulesReadyEvent | typeof DeferredRegistrationsUpdatedEvent) => {
        runtime.appRouterStore.dispatch({ type });
        runtime.eventBus.dispatch(eventName, createHeadlessWaitState(runtime));
    };

    const executeRegistrationRun = async (data?: TData) => {
        const registrationErrors = await runtime.moduleManager.registerModules<TRuntime, TContext, TData>(
            toLocalModuleDefinitions<TRuntime, TContext, TData>(localModules),
            { context }
        );

        dispatchAppRouterAction("modules-registered", ModulesRegisteredEvent);

        const deferredRegistrationErrors = await runtime.moduleManager.registerDeferredRegistrations(data);

        dispatchAppRouterAction("modules-ready", ModulesReadyEvent);

        return [...registrationErrors, ...deferredRegistrationErrors];
    };

    return {
        async register(data?: TData) {
            if (registerPromise) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner can only be called once. Did you mean to call the \"update\" function?");
            }

            // The assignment is synchronous, an async function body executes up to its first await when it's called.
            registerPromise = executeRegistrationRun(data);

            return registerPromise;
        },
        async update(data?: TData) {
            if (!registerPromise) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner must be called before the \"update\" function because an update run always follows a registration run.");
            }

            await registerPromise;

            // An update run is driven by the useUpdateDeferredRegistrations hook rather than by the module manager.
            runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

            const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

            dispatchAppRouterAction("deferred-registrations-updated", DeferredRegistrationsUpdatedEvent);

            runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

            return errors;
        }
    };
}
