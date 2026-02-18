import {
    fetchJson,
    isApiError,
    SessionManagerContext,
    SubscriptionContext,
    UserInfo,
    UserRole,
    type Session,
    type Subscription
} from "@endpoints/shared";
import { AppRouter as FireflyAppRouter, useDeferredRegistrations, useEnvironmentVariables, useIsBootstrapping, useLaunchDarklyClient, useLogger, useProtectedDataQueries, usePublicDataQueries } from "@squide/firefly";
import { useChangeLanguage } from "@squide/i18next";
import { useHoneycombInstrumentationClient } from "@workleap/telemetry/react";
import LogRocket from "logrocket";
import { useEffect, useMemo } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Loading } from "./Loading.tsx";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";
import { useSessionManagerInstance } from "./useSessionManagerInstance.ts";

function BootstrappingRoute() {
    const logger = useLogger();
    const environmentVariables = useEnvironmentVariables();

    // The chosen endpoints doesn't really make sense for "public" global data as those are never examples of public endpoints
    // but I quickly migrated to those from "feature flags" when introducing the LaunchDarkly plugin
    // and this is what it is for now.
    const [userRole, userInfo] = usePublicDataQueries([
        {
            queryKey: [`${environmentVariables.userRoleApiBaseUrl}getRole`],
            queryFn: async () => {
                const data = await fetchJson(`${environmentVariables.userRoleApiBaseUrl}getRole`);

                return data as UserRole;
            }
        },
        {
            queryKey: [`${environmentVariables.userInfoApiBaseUrl}getInfo`],
            queryFn: async () => {
                let data: UserInfo = {
                    email: "",
                    createdAt: "",
                    status: ""
                };

                try {
                    data = (await fetchJson(`${environmentVariables.userInfoApiBaseUrl}getInfo`)) as UserInfo;
                } catch (error: unknown) {
                    if (isApiError(error)) {
                        // Because the Express server is not deployed on Netlify.
                        if (error.status !== 404) {
                            throw error;
                        }
                    }
                }

                return data;
            }
        }
    ]);

    useEffect(() => {
        if (userRole) {
            logger.debug(`[shell] User role has been fetched: "${userRole}".`, {
                style: {
                    color: "orange"
                }
            });
        }
    }, [userRole, logger]);

    useEffect(() => {
        if (userInfo) {
            logger
                .withText("[shell] User info has been fetched", {
                    style: {
                        color: "orange"
                    }
                })
                .withObject(userInfo)
                .debug();
        }
    }, [userInfo, logger]);

    const [session, subscription] = useProtectedDataQueries([
        {
            queryKey: [`${environmentVariables.sessionApiBaseUrl}getSession`],
            queryFn: async () => {
                const data = await fetchJson(`${environmentVariables.sessionApiBaseUrl}getSession`);

                const result: Session = {
                    user: {
                        id: data.userId,
                        name: data.username,
                        preferredLanguage: data.preferredLanguage
                    }
                };

                return result;
            }
        },
        {
            queryKey: [`${environmentVariables.subscriptionApiBaseUrl}getSubscription`],
            queryFn: async () => {
                const data = await fetchJson(`${environmentVariables.subscriptionApiBaseUrl}getSubscription`);

                return data as Subscription;
            }
        }
    ], error => isApiError(error) && error.status === 401);

    const honeycombClient = useHoneycombInstrumentationClient({ throwOnUndefined: false });
    const launchDarklyClient = useLaunchDarklyClient();

    const changeLanguage = useChangeLanguage();

    useEffect(() => {
        if (session) {
            logger
                .withText("[shell] Session has been fetched:", {
                    style: {
                        color: "orange"
                    }
                })
                .withObject(session)
                .debug();

            honeycombClient?.setGlobalSpanAttributes({
                "app.user_id": session.user.id,
                "app.user_prefered_language": session.user.preferredLanguage
            });

            launchDarklyClient.identify({
                kind: "user",
                key: session.user.id,
                name: session.user.name
            }).then(() => {
                logger
                    .withText("[shell] LaunchDarkly session identified:")
                    .withObject(launchDarklyClient.getContext?.())
                    .debug();
            }).catch(() => {
                logger.error("[shell] Failed to identify LaunchDarkly session.");
            });

            LogRocket.identify(session.user.id, {
                "Name": session.user.name
            });

            // When the session has been retrieved, update the language to match the user
            // preferred language.
            changeLanguage(session.user.preferredLanguage);
        }
    }, [session, honeycombClient, launchDarklyClient, changeLanguage, logger]);

    useEffect(() => {
        if (subscription) {
            logger
                .withText("[shell] Subscription has been fetched:", {
                    style: {
                        color: "orange"
                    }
                })
                .withObject(subscription)
                .debug();
        }
    }, [subscription, logger]);

    useDeferredRegistrations(useMemo(() => ({
        session,
        userInfo,
        role: userRole
    }), [session, userInfo, userRole]));

    const sessionManager = useSessionManagerInstance(session);

    if (useIsBootstrapping()) {
        return <Loading />;
    }

    return (
        <SessionManagerContext.Provider value={sessionManager}>
            <SubscriptionContext.Provider value={subscription}>
                <Outlet />
            </SubscriptionContext.Provider>
        </SessionManagerContext.Provider>
    );
}

export function AppRouter() {
    const logger = useLogger();

    return (
        <FireflyAppRouter waitForPublicData waitForProtectedData>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                logger
                    .withText("[shell] React Router will be rendered with the following route definitions:")
                    .withObject(registeredRoutes)
                    .debug();

                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                errorElement: <RootErrorBoundary />,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ])}
                        {...routerProviderProps}
                    />
                );
            }}
        </FireflyAppRouter>
    );
}
