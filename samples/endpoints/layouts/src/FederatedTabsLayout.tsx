import { useRenderedNavigationItems, useRuntimeNavigationItems, type NavigationLinkRenderProps, type RenderItemFunction, type RenderSectionFunction } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { Suspense, useCallback, type MouseEvent } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Trans, useTranslation } from "react-i18next";
import { Link, Outlet, useNavigate } from "react-router";
import { i18NextInstanceKey } from "./i18next.ts";

export interface FederatedTabsLayoutProps {
    host?: string;
}

const renderItem: RenderItemFunction = (item, index, level) => {
    const { label, linkProps } = item as NavigationLinkRenderProps;

    return (
        <li key={`${level}-${index}`}>
            <Link {...linkProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSection: RenderSectionFunction = elements => {
    return (
        <ul style={{ listStyleType: "none", margin: 0, padding: 0, display: "flex", gap: "20px" }}>
            {elements}
        </ul>
    );
};

function TabsError() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("TabsError", { i18n: i18nextInstance });

    const navigate = useNavigate();

    const handleTryAgain = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Reload the page to reset the error boundary.
        navigate(0);
    }, [navigate]);

    return (
        <div>
            <div style={{ color: "red", marginBottom: "10px" }}>
                {t("message")}
            </div>
            <button type="button" onClick={handleTryAgain}>
                {t("tryAgainButtonLabel")}
            </button>
        </div>
    );
}

export function FederatedTabsLayout({ host }: FederatedTabsLayoutProps) {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("FederatedTabsLayout", { i18n: i18nextInstance });

    const navigationItems = useRuntimeNavigationItems({ menuId: "/federated-tabs" });
    const renderedTabs = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <h1>{t("title")}</h1>
            {host && <p style={{ backgroundColor: "blue", color: "white", width: "fit-content" }}>
                <Trans
                    i18n={i18nextInstance}
                    i18nKey="servedBy"
                    t={t}
                    shouldUnescape
                    values={{ host }}
                    components={{ code: <code /> }}
                />
            </p>}
            {renderedTabs}
            <div style={{ paddingTop: "20px" }}>
                <ErrorBoundary FallbackComponent={TabsError}>
                    <Suspense fallback={<div>{t("loadingMessage")}</div>}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </div>
        </>
    );
}


