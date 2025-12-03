import { useEventBus, useLogger, useRuntime } from "@squide/core";
import type { FeatureFlagsChangedListener } from "@squide/launch-darkly";
import { getLaunchDarklyPlugin } from "@squide/launch-darkly";
import { useCallback, useEffect, useMemo, useReducer, type Dispatch } from "react";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";
import { useAppRouterStore } from "./useAppRouterStore.ts";
import { useExecuteOnce } from "./useExecuteOnce.ts";
import { isBootstrapping } from "./useIsBootstrapping.ts";

export type ActiveRouteVisiblity = "unknown" | "public" | "protected";

export interface AppRouterWaitState {
    waitForMsw: boolean;
    waitForPublicData: boolean;
    waitForProtectedData: boolean;
}

export interface AppRouterState extends AppRouterWaitState {
    areModulesRegistered: boolean;
    areModulesReady: boolean;
    isMswReady: boolean;
    isPublicDataReady: boolean;
    isProtectedDataReady: boolean;
    publicDataUpdatedAt?: number;
    protectedDataUpdatedAt?: number;
    featureFlagsUpdatedAt?: number;
    deferredRegistrationsUpdatedAt?: number;
    activeRouteVisibility: ActiveRouteVisiblity;
    isUnauthorized: boolean;
}

export type AppRouterActionType =
    | "modules-registered"
    | "modules-ready"
    | "msw-ready"
    | "public-data-ready"
    | "protected-data-ready"
    | "public-data-updated"
    | "protected-data-updated"
    | "feature-flags-updated"
    | "deferred-registrations-updated"
    | "active-route-is-public"
    | "active-route-is-protected"
    | "is-unauthorized";

// The followings event const are a concatenation of "squide-" with AppRouterActionType.
// They are dispatched by the useEnhancedReducerDispatch hook.
export const ModulesRegisteredEvent = "squide-modules-registered";
export const ModulesReadyEvent = "squide-modules-ready";
export const MswReadyEvent = "squide-msw-ready";
export const ActiveRouteIsPublicEvent = "squide-active-route-is-public";
export const ActiveRouteIsProtectedEvent = "squide-active-route-is-protected";
export const PublicDataReadyEvent = "squide-public-data-ready";
export const ProtectedDataReadyEvent = "squide-protected-data-ready";
export const PublicDataUpdatedEvent = "squide-public-data-updated";
export const ProtectedDataUpdatedEvent = "squide-protected-data-updated";
export const DeferredRegistrationsUpdatedEvent = "squide-deferred-registrations-updated";
export const ApplicationBoostrappedEvent = "squide-app-boostrapped";

export interface AppRouterAction {
    type: AppRouterActionType;
    payload?: unknown;
}

export type AppRouterDispatch = Dispatch<AppRouterAction>;

function reducer(state: AppRouterState, action: AppRouterAction) {
    let newState = state;

    switch (action.type) {
        case "modules-registered": {
            newState = {
                ...newState,
                areModulesRegistered: true
            };

            break;
        }
        case "modules-ready": {
            newState = {
                ...newState,
                areModulesReady: true,
                // Will be set even if the app is not using deferred registrations.
                deferredRegistrationsUpdatedAt: Date.now()
            };

            break;
        }
        case "msw-ready": {
            newState = {
                ...newState,
                isMswReady: true
            };

            break;
        }
        case "public-data-ready": {
            newState = {
                ...newState,
                isPublicDataReady: true,
                publicDataUpdatedAt: Date.now()
            };

            break;
        }
        case "protected-data-ready": {
            newState = {
                ...newState,
                isProtectedDataReady: true,
                protectedDataUpdatedAt: Date.now()
            };

            break;
        }
        case "public-data-updated": {
            newState = {
                ...newState,
                publicDataUpdatedAt: Date.now()
            };

            break;
        }
        case "protected-data-updated": {
            newState = {
                ...newState,
                protectedDataUpdatedAt: Date.now()
            };

            break;
        }
        case "feature-flags-updated": {
            newState = {
                ...newState,
                featureFlagsUpdatedAt: Date.now()
            };

            break;
        }
        case "deferred-registrations-updated": {
            newState = {
                ...newState,
                deferredRegistrationsUpdatedAt: Date.now()
            };

            break;
        }
        case "active-route-is-public": {
            newState = {
                ...newState,
                activeRouteVisibility: "public"
            };

            break;
        }
        case "active-route-is-protected": {
            newState = {
                ...newState,
                activeRouteVisibility: "protected"
            };

            break;
        }
        case "is-unauthorized": {
            newState = {
                ...newState,
                isUnauthorized: true
            };

            break;
        }
        default: {
            throw new Error(`[squide] The AppRouter component state reducer doesn't support action type "${action.type}".`);
        }
    }

    return newState;
}

export function useModuleRegistrationStatusDispatcher(runtime: FireflyRuntime, areModulesRegisteredValue: boolean, areModulesReadyValue: boolean, dispatch: AppRouterDispatch) {
    const logger = useLogger();

    const dispatchModulesRegistered = useCallback(() => {
        dispatch({ type: "modules-registered" });

        logger
            .withText("[squide] Modules are registered.", {
                style: {
                    color: "green"
                }
            })
            .information();
    }, [dispatch, logger]);

    const dispatchModulesReady = useCallback(() => {
        dispatch({ type: "modules-ready" });

        logger
            .withText("[squide] Modules are ready.", {
                style: {
                    color: "green"
                }
            })
            .information();
    }, [dispatch, logger]);

    return useEffect(() => {
        if (!areModulesRegisteredValue) {
            runtime.moduleManager.registerModulesRegisteredListener(dispatchModulesRegistered);
        }

        if (!areModulesReadyValue) {
            runtime.moduleManager.registerModulesReadyListener(dispatchModulesReady);
        }

        return () => {
            runtime.moduleManager.removeModulesRegisteredListener(dispatchModulesRegistered);
            runtime.moduleManager.removeModulesReadyListener(dispatchModulesReady);
        };
    }, [areModulesRegisteredValue, areModulesReadyValue, dispatchModulesRegistered, dispatchModulesReady]);
}

export function useMswStatusDispatcher(runtime: FireflyRuntime, isMswReadyValue: boolean, dispatch: AppRouterDispatch) {
    const logger = useLogger();

    const dispatchMswReady = useCallback(() => {
        dispatch({ type: "msw-ready" });

        logger
            .withText("[squide] MSW is ready.", {
                style: {
                    color: "green"
                }
            })
            .information();
    }, [dispatch, logger]);

    useEffect(() => {
        if (runtime.isMswEnabled) {
            if (!isMswReadyValue) {
                runtime.getMswState().addMswReadyListener(dispatchMswReady);
            }

            return () => {
                runtime.getMswState().removeMswReadyListener(dispatchMswReady);
            };
        }
    }, [runtime, isMswReadyValue, dispatchMswReady]);
}

export function useFeatureFlagsDispatcher(runtime: FireflyRuntime, dispatch: AppRouterDispatch) {
    const logger = useLogger();

    const dispatchFeatureFlagsUpdated = useCallback((changes => {
        dispatch({ type: "feature-flags-updated" });

        logger
            .withText("[squide] Feature flags has been updated to:")
            .withObject(changes)
            .debug();
    }) satisfies FeatureFlagsChangedListener, [dispatch, logger]);

    useEffect(() => {
        if (runtime.isLaunchDarklyEnabled) {
            getLaunchDarklyPlugin(runtime).addFeatureFlagsChangedAndStateIsUpdatedListener(dispatchFeatureFlagsUpdated);

            return () => {
                getLaunchDarklyPlugin(runtime).removeFeatureFlagsChangedAndStateIsUpdatedListener(dispatchFeatureFlagsUpdated);
            };
        }
    }, [runtime]);
}

function useBootstrappingCompletedDispatcher(waitState: AppRouterWaitState, state: AppRouterState) {
    const eventBus = useEventBus();

    const areModulesRegisteredValue = state.areModulesRegistered;
    const isBoostrapping = isBootstrapping(state);

    useExecuteOnce(useCallback(() => {
        if (areModulesRegisteredValue && !isBoostrapping) {
            eventBus.dispatch(ApplicationBoostrappedEvent, waitState);

            return true;
        }

        return false;
    }, [areModulesRegisteredValue, isBoostrapping, waitState, eventBus]), true);
}

let dispatchProxyFactory: ((reactDispatch: AppRouterDispatch) => AppRouterDispatch) | undefined;

// This function should only be used by tests.
export function __setAppReducerDispatchProxyFactory(factory: (reactDispatch: AppRouterDispatch) => AppRouterDispatch) {
    dispatchProxyFactory = factory;
}

// This function should only be used by tests.
export function __clearAppReducerDispatchProxy() {
    dispatchProxyFactory = undefined;
}

function useReducerDispatchProxy(reactDispatch: AppRouterDispatch) {
    return useMemo(() => {
        return dispatchProxyFactory ? dispatchProxyFactory(reactDispatch) : reactDispatch;
    }, [reactDispatch]);
}

function useEnhancedReducerDispatch(waitState: AppRouterWaitState, reducerDispatch: AppRouterDispatch) {
    const logger = useLogger();
    const appRouterStore = useAppRouterStore();
    const eventBus = useEventBus();

    return useCallback((action: AppRouterAction) => {
        logger
            .withText("[squide] The following action has been dispatched to the AppRouter reducer:")
            .withObject(action)
            .debug();

        appRouterStore.dispatch({ ...action, payload: waitState });
        eventBus.dispatch(`squide-${action.type}`, waitState);

        reducerDispatch(action);
    }, [waitState, reducerDispatch, logger, appRouterStore, eventBus]);
}

export function useAppRouterReducer(waitForPublicData: boolean, waitForProtectedData: boolean): [AppRouterState, AppRouterDispatch] {
    const runtime = useRuntime() as FireflyRuntime;
    const eventBus = useEventBus();
    const appRouterStore = useAppRouterStore();

    const isMswEnabled = runtime.isMswEnabled;
    const areModulesInitiallyRegistered = runtime.moduleManager.getAreModulesRegistered();
    const areModulesInitiallyReady = runtime.moduleManager.getAreModulesReady();
    const isMswInitiallyReady = runtime.isMswEnabled ? runtime.getMswState().isReady : false;

    const waitState = useMemo(() => ({
        waitForMsw: isMswEnabled,
        waitForPublicData,
        waitForProtectedData
    }), [isMswEnabled, waitForPublicData, waitForProtectedData]);

    const initialState = useMemo(() => ({
        waitForMsw: waitState.waitForMsw,
        waitForPublicData: waitState.waitForPublicData,
        waitForProtectedData: waitState.waitForProtectedData,
        // When the modules registration functions are awaited, the event listeners are registered after the modules are registered.
        areModulesRegistered: areModulesInitiallyRegistered,
        areModulesReady: areModulesInitiallyReady,
        isMswReady: isMswInitiallyReady,
        isPublicDataReady: false,
        isProtectedDataReady: false,
        activeRouteVisibility: "unknown",
        isUnauthorized: false
    } satisfies AppRouterState), [waitState, areModulesInitiallyRegistered, areModulesInitiallyReady, isMswInitiallyReady]);

    // When modules are initially registered, the reducer action will never be dispatched, therefore the event would not be dispatched as well.
    // To ensure the bootstrapping events sequencing, the event is manually dispatched when the modules are initially registered.
    useExecuteOnce(useCallback(() => {
        if (areModulesInitiallyRegistered) {
            appRouterStore.dispatch({ type: "modules-registered", payload: waitState });
            eventBus.dispatch(ModulesRegisteredEvent, waitState);
        }

        return true;
    }, [areModulesInitiallyRegistered, appRouterStore, eventBus, waitState]), true);

    // When modules are initially registered, the reducer action will never be dispatched, therefore the event would not be dispatched as well.
    // To ensure the bootstrapping events sequencing, the event is manually dispatched when the modules are initially registered.
    useExecuteOnce(useCallback(() => {
        if (areModulesInitiallyReady) {
            appRouterStore.dispatch({ type: "modules-ready", payload: waitState });
            eventBus.dispatch(ModulesReadyEvent, waitState);
        }

        return true;
    }, [areModulesInitiallyReady, appRouterStore, eventBus, waitState]), true);

    // When modules are initially registered, the reducer action will never be dispatched, therefore the event would not be dispatched as well.
    // To ensure the bootstrapping events sequencing, the event is manually dispatched when the modules are initially registered.
    useExecuteOnce(useCallback(() => {
        if (isMswInitiallyReady) {
            appRouterStore.dispatch({ type: "msw-ready", payload: waitState });
            eventBus.dispatch(MswReadyEvent, waitState);
        }

        return true;
    }, [isMswInitiallyReady, appRouterStore, eventBus, waitState]), true);

    const [state, reactDispatch] = useReducer(reducer, initialState);

    const {
        areModulesRegistered: areModulesRegisteredValue,
        areModulesReady: areModulesReadyValue,
        isMswReady: isMswReadyValue
    } = state;

    // The dispatch proxy is strictly an utility allowing tests to mock the useReducer dispatch function. It's easier
    // than mocking the import from React.
    const dispatchProxy = useReducerDispatchProxy(reactDispatch);
    const dispatch = useEnhancedReducerDispatch(waitState, dispatchProxy);

    useModuleRegistrationStatusDispatcher(runtime, areModulesRegisteredValue, areModulesReadyValue, dispatch);
    useMswStatusDispatcher(runtime, isMswReadyValue, dispatch);
    useFeatureFlagsDispatcher(runtime, dispatch);
    useBootstrappingCompletedDispatcher(waitState, state);

    return [state, dispatch];
}
