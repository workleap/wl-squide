import { addLocalModuleRegistrationStatusChangedListener, getLocalModuleRegistrationStatus, removeLocalModuleRegistrationStatusChangedListener, useEventBus, useLogger, useRuntime } from "@squide/core";
import { addRemoteModuleRegistrationStatusChangedListener, areModulesReady, areModulesRegistered, getRemoteModuleRegistrationStatus, removeRemoteModuleRegistrationStatusChangedListener } from "@squide/module-federation";
import { addMswStateChangedListener, isMswReady, removeMswStateChangedListener } from "@squide/msw";
import { useCallback, useEffect, useMemo, useReducer, type Dispatch } from "react";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";
import { useAppRouterStore } from "./useAppRouterStore.ts";
import { useExecuteOnce } from "./useExecuteOnce.ts";
import { isBootstrapping } from "./useIsBootstrapping.ts";

export type ActiveRouteVisiblity = "unknown" | "public" | "protected";

export interface AppRouterState {
    waitForMsw: boolean;
    waitForPublicData: boolean;
    waitForProtectedData: boolean;
    areModulesRegistered: boolean;
    areModulesReady: boolean;
    isMswReady: boolean;
    isPublicDataReady: boolean;
    isProtectedDataReady: boolean;
    publicDataUpdatedAt?: number;
    protectedDataUpdatedAt?: number;
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

export function getAreModulesRegistered() {
    const localModuleStatus = getLocalModuleRegistrationStatus();
    const remoteModuleStatus = getRemoteModuleRegistrationStatus();

    return areModulesRegistered(localModuleStatus, remoteModuleStatus);
}

export function getAreModulesReady() {
    const localModuleStatus = getLocalModuleRegistrationStatus();
    const remoteModuleStatus = getRemoteModuleRegistrationStatus();

    return areModulesReady(localModuleStatus, remoteModuleStatus);
}

export function useModuleRegistrationStatusDispatcher(areModulesRegisteredValue: boolean, areModulesReadyValue: boolean, dispatch: AppRouterDispatch) {
    const logger = useLogger();

    const dispatchModulesRegistered = useExecuteOnce(useCallback(() => {
        if (getAreModulesRegistered()) {
            dispatch({ type: "modules-registered" });

            logger.debug("[squide] %cModules are registered%c.", "color: white; background-color: green;", "");

            return true;
        }

        return false;
    }, [dispatch, logger]));

    const dispatchModulesReady = useExecuteOnce(useCallback(() => {
        if (getAreModulesReady()) {
            dispatch({ type: "modules-ready" });

            logger.debug("[squide] %cModules are ready%c.", "color: white; background-color: green;", "");

            return true;
        }

        return false;
    }, [dispatch, logger]));

    return useEffect(() => {
        if (!areModulesRegisteredValue) {
            addLocalModuleRegistrationStatusChangedListener(dispatchModulesRegistered);
            addRemoteModuleRegistrationStatusChangedListener(dispatchModulesRegistered);
        }

        if (!areModulesReadyValue) {
            addLocalModuleRegistrationStatusChangedListener(dispatchModulesReady);
            addRemoteModuleRegistrationStatusChangedListener(dispatchModulesReady);
        }

        return () => {
            removeLocalModuleRegistrationStatusChangedListener(dispatchModulesRegistered);
            removeRemoteModuleRegistrationStatusChangedListener(dispatchModulesRegistered);

            removeLocalModuleRegistrationStatusChangedListener(dispatchModulesReady);
            removeRemoteModuleRegistrationStatusChangedListener(dispatchModulesReady);
        };
    }, [areModulesRegisteredValue, areModulesReadyValue, dispatchModulesRegistered, dispatchModulesReady]);
}

export function useMswStatusDispatcher(isMswReadyValue: boolean, dispatch: AppRouterDispatch) {
    const logger = useLogger();

    const dispatchMswReady = useExecuteOnce(useCallback(() => {
        if (isMswReady()) {
            dispatch({ type: "msw-ready" });

            logger.debug("[squide] %cMSW is ready%c.", "color: white; background-color: green;", "");

            return true;
        }

        return false;
    }, [dispatch, logger]));

    useEffect(() => {
        if (!isMswReadyValue) {
            addMswStateChangedListener(dispatchMswReady);
        }

        return () => {
            removeMswStateChangedListener(dispatchMswReady);
        };
    }, [isMswReadyValue, dispatchMswReady]);
}

export function useBootstrappingCompletedDispatcher(state: AppRouterState) {
    const eventBus = useEventBus();

    const areModulesRegisteredValue = state.areModulesRegistered;
    const isBoostrapping = isBootstrapping(state);

    useExecuteOnce(useCallback(() => {
        if (areModulesRegisteredValue && !isBoostrapping) {
            eventBus.dispatch(ApplicationBoostrappedEvent);

            return true;
        }

        return false;
    }, [areModulesRegisteredValue, isBoostrapping, eventBus]), true);
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

function useEnhancedReducerDispatch(reducerDispatch: AppRouterDispatch) {
    const logger = useLogger();
    const appRouterStore = useAppRouterStore();
    const eventBus = useEventBus();

    return useCallback((action: AppRouterAction) => {
        logger.debug("[squide] The following action has been dispatched to the AppRouter reducer:", action);

        appRouterStore.dispatch(action);
        eventBus.dispatch(`squide-${action.type}`);

        reducerDispatch(action);
    }, [reducerDispatch, logger, appRouterStore, eventBus]);
}

export function useAppRouterReducer(waitForPublicData: boolean, waitForProtectedData: boolean): [AppRouterState, AppRouterDispatch] {
    const runtime = useRuntime() as FireflyRuntime;
    const eventBus = useEventBus();
    const appRouterStore = useAppRouterStore();

    const areModulesInitiallyRegistered = getAreModulesRegistered();
    const areModulesInitiallyReady = getAreModulesReady();
    const isMswInitiallyReady = isMswReady();

    // When modules are initially registered, the reducer action will never be dispatched, therefore the event would not be dispatched as well.
    // To ensure the bootstrapping events sequencing, the event is manually dispatched when the modules are initially registered.
    useExecuteOnce(useCallback(() => {
        if (areModulesInitiallyRegistered) {
            appRouterStore.dispatch({ type: "modules-registered" });
            eventBus.dispatch(ModulesRegisteredEvent);
        }

        return true;
    }, [areModulesInitiallyRegistered, appRouterStore, eventBus]), true);

    // When modules are initially registered, the reducer action will never be dispatched, therefore the event would not be dispatched as well.
    // To ensure the bootstrapping events sequencing, the event is manually dispatched when the modules are initially registered.
    useExecuteOnce(useCallback(() => {
        if (areModulesInitiallyReady) {
            appRouterStore.dispatch({ type: "modules-ready" });
            eventBus.dispatch(ModulesReadyEvent);
        }

        return true;
    }, [areModulesInitiallyReady, appRouterStore, eventBus]), true);

    // When modules are initially registered, the reducer action will never be dispatched, therefore the event would not be dispatched as well.
    // To ensure the bootstrapping events sequencing, the event is manually dispatched when the modules are initially registered.
    useExecuteOnce(useCallback(() => {
        if (isMswInitiallyReady) {
            appRouterStore.dispatch({ type: "msw-ready" });
            eventBus.dispatch(MswReadyEvent);
        }

        return true;
    }, [isMswInitiallyReady, appRouterStore, eventBus]), true);

    const [state, reactDispatch] = useReducer(reducer, {
        waitForMsw: runtime.isMswEnabled,
        waitForPublicData,
        waitForProtectedData,
        // When the modules registration functions are awaited, the event listeners are registered after the modules are registered.
        areModulesRegistered: areModulesInitiallyRegistered,
        areModulesReady: areModulesInitiallyReady,
        isMswReady: isMswInitiallyReady,
        isPublicDataReady: false,
        isProtectedDataReady: false,
        activeRouteVisibility: "unknown",
        isUnauthorized: false
    });

    const {
        areModulesRegistered: areModulesRegisteredValue,
        areModulesReady: areModulesReadyValue,
        isMswReady: isMswReadyValue
    } = state;

    // The dispatch proxy is strictly an utility allowing tests to mock the useReducer dispatch function. It's easier
    // than mocking the import from React.
    const dispatchProxy = useReducerDispatchProxy(reactDispatch);
    const dispatch = useEnhancedReducerDispatch(dispatchProxy);

    useModuleRegistrationStatusDispatcher(areModulesRegisteredValue, areModulesReadyValue, dispatch);
    useMswStatusDispatcher(isMswReadyValue, dispatch);
    useBootstrappingCompletedDispatcher(state);

    return [state, dispatch];
}
