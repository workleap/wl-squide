import { fetchJson, postJson, toSubscriptionStatusLabel, useSessionManager, useSubscription } from "@endpoints/shared";
import { useEnvironmentVariable, useEnvironmentVariables } from "@squide/env-vars";
import { isNavigationLink, useLogger, useNavigationItems, useRenderedNavigationItems, type NavigationLinkRenderProps, type NavigationSectionRenderProps, type RenderItemFunction, type RenderSectionFunction } from "@squide/firefly";
import { useI18nextInstance } from "@squide/i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Suspense, useCallback, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useNavigate } from "react-router";
import { Loading } from "./Loading.tsx";
import { i18NextInstanceKey } from "./i18next.ts";

type RenderLinkItemFunction = (item: NavigationLinkRenderProps, key: string) => ReactNode;

type RenderSectionItemFunction = (item: NavigationSectionRenderProps, key: string) => ReactNode;

const renderLinkItem: RenderLinkItemFunction = ({ label, linkProps, additionalProps: { highlight, ...additionalProps } }, key) => {
    return (
        <li key={key} style={{ fontWeight: highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>
                {label}
            </Link>
        </li>
    );
};

const renderSectionItem: RenderSectionItemFunction = ({ label, section }, key) => {
    return (
        <li key={key} style={{ display: "flex", gap: "5px" }}>
            {label}
            <div style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                ({section})
            </div>
        </li>
    );
};

const renderItem: RenderItemFunction = (item, key) => {
    return isNavigationLink(item) ? renderLinkItem(item, key) : renderSectionItem(item, key);
};

const renderSection: RenderSectionFunction = (elements, key) => {
    return (
        <ul key={key} style={{ display: "flex", gap: "10px", padding: 0, listStyleType: "none" }}>
            {elements}
        </ul>
    );
};

export function AuthenticatedLayout() {
    const i18nextInstance = useI18nextInstance(i18NextInstanceKey);
    const { t } = useTranslation("AuthenticatedLayout", { i18n: i18nextInstance });

    const authenticationApiBaseUrl = useEnvironmentVariable("authenticationApiBaseUrl");
    const sessionApiBaseUrl = useEnvironmentVariable("sessionApiBaseUrl");
    const featureFlagsApiBaseUrl = useEnvironmentVariable("featureFlagsApiBaseUrl");
    const subscriptionApiBaseUrl = useEnvironmentVariable("subscriptionApiBaseUrl");

    const logger = useLogger();
    const sessionManager = useSessionManager();
    const session = sessionManager?.getSession();
    const subscription = useSubscription();

    const subscriptionStatusLabel = toSubscriptionStatusLabel(subscription!.status, {
        trialLabel: t("trialLabel"),
        paidLabel: t("paidLabel"),
        notPaidLabel: t("notPaidLabel")
    });

    const queryClient = useQueryClient();
    const environmentVariables = useEnvironmentVariables();

    const navigate = useNavigate();

    const handleDisconnect = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        postJson(`${authenticationApiBaseUrl}logout`)
            .then(() => {
                sessionManager?.clearSession();

                logger.debug("[shell] The user session has been cleared.");

                navigate("/logout");
            })
            .catch(() => {
                throw new Error("An unknown error happened while disconnecting the user.");
            });
    }, [logger, navigate, sessionManager, authenticationApiBaseUrl]);

    const handleUpdateSession = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        await postJson(`${sessionApiBaseUrl}updateSession`)
            .then(() => {
                logger.debug("[shell] Updated the user session.");
            });

        queryClient.refetchQueries({ queryKey: [`${environmentVariables.sessionApiBaseUrl}getSession`] });
    }, [logger, sessionApiBaseUrl, queryClient, environmentVariables]);

    const handleShuffleFeatureFlags = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        await postJson(`${featureFlagsApiBaseUrl}shuffle`)
            .then(() => {
                logger.debug("[shell] Shuffled the feature flags.");
            });

        queryClient.refetchQueries({ queryKey: [`${environmentVariables.featureFlagsApiBaseUrl}getAll`] });
    }, [logger, featureFlagsApiBaseUrl, queryClient, environmentVariables]);

    const handleDeactivateFeatureB = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        await postJson(`${featureFlagsApiBaseUrl}deactivateFeatureB`)
            .then(() => {
                logger.debug("[shell] Deactivated feature B.");
            });

        queryClient.refetchQueries({ queryKey: [`${environmentVariables.featureFlagsApiBaseUrl}getAll`] });
    }, [logger, featureFlagsApiBaseUrl, queryClient, environmentVariables]);

    const handleFailing = useCallback(async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        await fetchJson(`${subscriptionApiBaseUrl}failing`);
    }, [subscriptionApiBaseUrl]);

    const navigationItems = useNavigationItems();
    const renderedNavigationItems = useRenderedNavigationItems(navigationItems, renderItem, renderSection);

    return (
        <>
            <div style={{ display: "flex", alignItems: "center" }}>
                <nav style={{ width: "100%" }}>
                    {renderedNavigationItems}
                </nav>
                <div style={{ whiteSpace: "nowrap", marginRight: "20px" }}>
                    {/* Must check for a null session because when the disconnect button is clicked, it will clear the session and rerender this layout. */}
                    {/* eslint-disable-next-line max-len */}
                    ({t("subscriptionLabel")}: <span style={{ fontWeight: "bold" }}>{subscriptionStatusLabel}</span><span style={{ marginLeft: "10px", marginRight: "10px" }}>-</span>{t("userLabel")}: <span style={{ fontWeight: "bold" }}>{session?.user?.name}/{session?.user?.preferredLanguage}</span>)
                </div>
                <div>
                    <button type="button" onClick={handleUpdateSession} style={{ whiteSpace: "nowrap", marginRight: "10px" }}>
                        {t("updateSessionButtonLabel")}
                    </button>
                </div>
                <div>
                    <button type="button" onClick={handleShuffleFeatureFlags} style={{ whiteSpace: "nowrap", marginRight: "10px" }}>
                        {t("shuffleFeatureFlagsLabel")}
                    </button>
                </div>
                <div>
                    <button type="button" onClick={handleDeactivateFeatureB} style={{ whiteSpace: "nowrap", marginRight: "10px" }}>
                        {t("deactivateFeatureBLabel")}
                    </button>
                </div>
                <div>
                    <button type="button" onClick={handleFailing} style={{ whiteSpace: "nowrap", marginRight: "10px" }}>
                        {t("failingLabel")}
                    </button>
                </div>
                <div>
                    <button type="button" onClick={handleDisconnect} style={{ whiteSpace: "nowrap" }}>
                        {t("disconnectButtonLabel")}
                    </button>
                </div>
            </div>
            <Suspense fallback={<Loading />}>
                <Outlet />
            </Suspense>
        </>
    );
}

/** @alias */
export const Component = AuthenticatedLayout;
