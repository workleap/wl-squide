import { useAppRouterState } from "./AppRouterContext.ts";

export function useCanUpdateDeferredRegistrations() {
    const {
        areModulesReady,
        publicDataUpdatedAt,
        protectedDataUpdatedAt,
        featureFlagsUpdatedAt,
        deferredRegistrationsUpdatedAt
    } = useAppRouterState();

    return (
        // Do not trigger an update if the deferred registrations has not been registered yet (if there are deferred registrations, once they are
        // registered, the modules will be marked as ready).
        areModulesReady
        // Make sure the apps is actually having deferred registrations.
        && deferredRegistrationsUpdatedAt
        // If either the public data or the protected data has been updated, update the deferred registrations.
        && (
            (publicDataUpdatedAt && publicDataUpdatedAt > deferredRegistrationsUpdatedAt) ||
            (protectedDataUpdatedAt && protectedDataUpdatedAt > deferredRegistrationsUpdatedAt) ||
            (featureFlagsUpdatedAt && featureFlagsUpdatedAt > deferredRegistrationsUpdatedAt)
        )
    );
}
