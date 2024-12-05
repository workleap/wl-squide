import { useIsAuthenticated } from "@basic-mix/shared";
import { useLogger } from "@squide/firefly";
import { Navigate, Outlet } from "react-router-dom";

export function AuthenticationBoundary() {
    const logger = useLogger();
    const isAuthenticated = useIsAuthenticated();

    if (isAuthenticated) {
        return <Outlet />;
    }

    logger.debug("[shell] The user is not authenticated, redirecting to the login page.");

    return <Navigate to="/login" />;
}

/** @alias */
export const Component = AuthenticationBoundary;
