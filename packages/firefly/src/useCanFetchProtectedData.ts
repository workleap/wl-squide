import { useAppRouterState } from "./AppRouterContext.ts";
import type { ActiveRouteVisiblity } from "./AppRouterReducer.ts";

// This function is exported for external integration, like the integration
// with the Platform Widgets. Do not remove.
export function canFetchProtectedData(
    waitForMsw: boolean,
    areModulesRegistered: boolean,
    areModulesReady: boolean,
    activeRouteVisibility: ActiveRouteVisiblity,
    isMswReady: boolean
) {
    return (
        // Wait until the modules has been registered, but do not wait for the deferred registrations to be registered as they will probably
        // depends on the protected data.
        (areModulesRegistered || areModulesReady)
        // Only fetch the protected data for protected routes, aka do not fetch the protected data for public routes.
        && activeRouteVisibility === "protected"
        // Wait for MSW since the endpoints for the protected data might be an MSW endpoint when in development.
        && (!waitForMsw || isMswReady)
    );
}

export function useCanFetchProtectedData() {
    const {
        waitForMsw,
        areModulesRegistered,
        areModulesReady,
        isMswReady,
        isProtectedDataReady,
        activeRouteVisibility
    } = useAppRouterState();

    // Always return true when the protected data has already been fetched sucessfully so TanStack Query can update the data in the background.
    return isProtectedDataReady || canFetchProtectedData(
        waitForMsw,
        areModulesRegistered,
        areModulesReady,
        activeRouteVisibility,
        isMswReady
    );
}
