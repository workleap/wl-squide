import { useIsAuthenticated, useLogger } from "@squide/firefly";
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

export const Component = AuthenticationBoundary;
