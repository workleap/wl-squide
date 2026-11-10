import { useAppRouterState } from "./AppRouterContext.ts";

export function useCanRegisterDeferredRegistrations() {
    const { waitForPublicData, waitForProtectedData, areModulesReady, areModulesRegistered, isPublicDataReady, isProtectedDataReady, activeRouteVisibility, isUnauthorized } = useAppRouterState();

    return (
        !isUnauthorized &&
        // Wait for the modules to be registered but make sure the deferred registrations has not been registered yet (updates are handled by another hook).
        areModulesRegistered &&
        !areModulesReady &&
        // && (!waitForMsw || isMswReady)
        // Wait for the initial data to be ready since the deferred registrations will probably need that data.
        (!waitForPublicData || isPublicDataReady) &&
        (!waitForProtectedData || activeRouteVisibility === "public" || isProtectedDataReady)
    );
}
