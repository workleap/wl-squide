import { toLocalModuleDefinitions, type ModuleRegisterFunction, type ModuleRegistrationError } from "@squide/core";
import type { AppRouterWaitState } from "../AppRouterReducer.ts";
import type { FireflyRuntime } from "../FireflyRuntime.tsx";
import { DeferredRegistrationsUpdateCompletedEvent, DeferredRegistrationsUpdateStartedEvent } from "../useUpdateDeferredRegistrations.ts";

// At runtime this payload is the AppRouter wait state, which only exists once the AppRouter is rendered.
// A runner is headless, therefore there's nothing to wait for. Deriving "waitForMsw" from the runtime would be
// closer to a real application, but a runner doesn't run the MSW lifecycle, so "isMswReady" would never become
// true and a consumer combining the two would conclude that the application is bootstrapping forever.
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

    // Keeping the promise of the last run rather than a boolean so that a run cannot race a previous run that
    // hasn't been awaited, which would otherwise fail deep inside the module registries with an unrelated message.
    let lastRunPromise: Promise<ModuleRegistrationError[]> | undefined;

    // Matching useEnhancedReducerDispatch, which updates the app router store and dispatches an event for every
    // action dispatched to the app router reducer. Modules, plugins and third-party libraries such as the Platform
    // Widgets do listen to these events and read the store, therefore a run that doesn't reproduce them doesn't
    // reproduce what happens in a real application.
    const dispatchAppRouterAction = (type: "modules-registered" | "modules-ready" | "deferred-registrations-updated") => {
        runtime.appRouterStore.dispatch({ type });

        // The event constants are a concatenation of "squide-" with the action type, which is how
        // useEnhancedReducerDispatch derives them as well.
        runtime.eventBus.dispatch(`squide-${type}`, { ...HeadlessWaitState });
    };

    const executeRegistrationRun = async (data?: TData) => {
        const registrationErrors = await runtime.moduleManager.registerModules<TRuntime, TContext, TData>(
            toLocalModuleDefinitions<TRuntime, TContext, TData>(localModules),
            { context }
        );

        dispatchAppRouterAction("modules-registered");

        const deferredRegistrationErrors = await runtime.moduleManager.registerDeferredRegistrations(data);

        dispatchAppRouterAction("modules-ready");

        return [...registrationErrors, ...deferredRegistrationErrors];
    };

    const executeUpdateRun = async (previousRun: Promise<ModuleRegistrationError[]>, data?: TData) => {
        // Serialized against the previous run, otherwise a second update would open a transactional registration
        // scope while the previous one is still active.
        await previousRun;

        // An update run is driven by the useUpdateDeferredRegistrations hook rather than by the module manager.
        runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

        const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

        dispatchAppRouterAction("deferred-registrations-updated");

        runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

        return errors;
    };

    return {
        async register(data?: TData) {
            if (lastRunPromise) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner can only be called once. Did you mean to call the \"update\" function?");
            }

            // The assignment is synchronous, an async function body executes up to its first await when it's called.
            lastRunPromise = executeRegistrationRun(data);

            return lastRunPromise;
        },
        async update(data?: TData) {
            if (!lastRunPromise) {
                throw new Error("[squide] The \"register\" function of a deferred registrations runner must be called before the \"update\" function because an update run always follows a registration run.");
            }

            lastRunPromise = executeUpdateRun(lastRunPromise, data);

            return lastRunPromise;
        }
    };
}
