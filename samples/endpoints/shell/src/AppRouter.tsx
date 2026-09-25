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
import { AppRouter as FireflyAppRouter, useDeferredRegistrations, useEnvironmentVariables, useIsBootstrapping, useLaunchDarklyClient, useLogger, useProtectedDataQueries, usePublicDataQueries, type DeferredRegistrationsErrorCallback } from "@squide/firefly";
import { isI18nextResourcesLoadError } from "@squide/i18next";
import { useHoneycombInstrumentationClient } from "@workleap/telemetry/react";
import LogRocket from "logrocket";
import { useCallback, useEffect, useMemo } from "react";
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
        }
    }, [session, honeycombClient, launchDarklyClient, logger]);

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

    // The shell's deferred registration awaits the switch to the user preferred language. A failed resources load
    // rejects that switch, which is reported here. The application still renders with the previous language.
    const handleDeferredRegistrationErrors = useCallback<DeferredRegistrationsErrorCallback>(errors => {
        errors.forEach(x => {
            if (isI18nextResourcesLoadError(x.cause)) {
                logger
                    .withText(`[shell] The "${x.cause.language}" resources of the "${x.cause.key}" i18next instance failed to load, the language is unchanged:`)
                    .withError(x.cause)
                    .error();
            } else {
                logger
                    .withText("[shell] A deferred registration failed:")
                    .withError(x)
                    .error();
            }
        });
    }, [logger]);

    useDeferredRegistrations(useMemo(() => ({
        session,
        userInfo,
        role: userRole
    }), [session, userInfo, userRole]), {
        onError: handleDeferredRegistrationErrors
    });

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
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => {
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
                        ], routerProps)}
                        {...routerProviderProps}
                    />
                );
            }}
        </FireflyAppRouter>
    );
}
