import { useAppRouterState } from "./AppRouterContext.ts";

export function useCanFetchPublicData() {
    const { waitForMsw, areModulesRegistered, areModulesReady, isMswReady, isPublicDataReady } = useAppRouterState();

    return (
        // Always return true when the public data has already been fetched sucessfully so TanStack Query can update the data in the background.
        isPublicDataReady ||
        // Wait until the modules has been registered, but do not wait for the deferred registrations to be registered has they will probably
        // depends on the protected data.
        ((areModulesRegistered || areModulesReady) &&
            // Wait for MSW since the endpoints for the protected data might be an MSW endpoint when in development.
            (!waitForMsw || isMswReady))
    );
}
