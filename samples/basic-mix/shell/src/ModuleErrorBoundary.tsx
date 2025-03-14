import { useLogger } from "@squide/firefly";
import { useCallback, useEffect } from "react";
import { isRouteErrorResponse, useLocation, useRouteError } from "react-router";

function getErrorMessage(error: unknown) {
    if (isRouteErrorResponse(error)) {
        return `${error.status} ${error.statusText}`;
    }

    return error instanceof Error
        ? error.message
        : JSON.stringify(error);
}

export function ModuleErrorBoundary() {
    const error = useRouteError();
    const location = useLocation();
    const logger = useLogger();

    const handleReloadButtonClick = useCallback(() => {
        window.location.reload();
    }, []);

    useEffect(() => {
        logger.error(`[shell] An unmanaged error occurred while rendering the route with path ${location.pathname}`, error);
    }, [location.pathname, error, logger]);

    return (
        <div style={{ color: "red" }}>
            <h2>Unmanaged error</h2>
            <p>An unmanaged error occurred inside a module. Still, other parts of the application are fully functional!</p>
            <span role="img" aria-label="pointer">👉</span> {getErrorMessage(error)}
            <br /><br />
            <button type="button" onClick={handleReloadButtonClick}>Reload</button>
        </div>
    );
}

/** @alias */
export const ErrorBoundary = ModuleErrorBoundary;
