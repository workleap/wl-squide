import { isGlobalDataQueriesError, useLogger } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isRouteErrorResponse, useLocation, useRouteError } from "react-router";
import { i18NextInstanceKey } from "./i18next.ts";

function getErrorMessage(error: unknown) {
    if (isRouteErrorResponse(error)) {
        return `${error.status} ${error.statusText}`;
    }

    return error instanceof Error
        ? error.message
        : JSON.stringify(error);
}

export function ModuleErrorBoundary() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("ModuleErrorBoundary", { i18n: i18nextInstance });

    const error = useRouteError() as Error;
    const location = useLocation();
    const logger = useLogger();

    const handleReloadButtonClick = useCallback(() => {
        window.location.reload();
    }, []);

    useEffect(() => {
        if (isRouteErrorResponse(error)) {
            logger.error(`[shell] An unmanaged error occurred while rendering the route with path ${location.pathname}`, `${error.status} ${error.statusText}`);
        } else if (isGlobalDataQueriesError(error)) {
            logger.error(`[shell] An unmanaged error occurred while rendering the route with path ${location.pathname}`, error.message, error.errors);
        } else {
            logger.error(`[shell] An unmanaged error occurred while rendering the route with path ${location.pathname}`, error);
        }
    }, [location.pathname, error, logger]);

    return (
        <div>
            <h2>{t("title")}</h2>
            <p style={{ color: "red" }}>{t("message")}</p>
            <p style={{ color: "red" }}><span role="img" aria-label="pointer">👉</span> {getErrorMessage(error)}</p>
            <p style={{ color: "gray" }}><code>{error.stack}</code></p>
            <br />
            <button type="button" onClick={handleReloadButtonClick}>{t("reloadButtonLabel")}</button>
        </div>
    );
}

/** @alias */
export const ErrorBoundary = ModuleErrorBoundary;
