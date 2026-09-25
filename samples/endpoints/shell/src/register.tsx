import { registerLayouts } from "@endpoints/layouts";
import type { DeferredRegistrationData, LanguageKey } from "@endpoints/shared";
import { mergeDeferredRegistrations, ProtectedRoutes, PublicRoutes, type DeferredRegistrationFunction, type FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";
import { getI18nextPlugin, type i18nextPlugin } from "@squide/i18next";
import { RootLayout } from "./RootLayout.tsx";
import { initI18next } from "./i18next.ts";

export interface RegisterShellOptions {
    // This is only for demo purposed, do not copy this.
    host?: string;
}

function registerRoutes(runtime: FireflyRuntime, host?: string) {
    runtime.registerPublicRoute({
        // Pathless route to declare a root layout and a root error boundary.
        $id: "root-layout",
        loader: async () => {
            const response = await fetch(runtime.getEnvironmentVariable("dummyHandlerUrl"));

            return response.json();
        },
        element: <RootLayout />,
        children: [
            PublicRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerRoute({
        // Pathless route to declare an authenticated boundary.
        lazy: () => import("./AuthenticationBoundary.tsx"),
        children: [
            {
                // Pathless route to declare an authenticated layout.
                lazy: async () => {
                    const { AuthenticatedLayout } = await import("./AuthenticatedLayout.tsx");

                    return {
                        element: <AuthenticatedLayout />
                    };
                },
                children: [
                    {
                        // Pathless route to declare an error boundary inside the layout instead of outside.
                        // It's quite useful to prevent losing the layout when an unmanaged error occurs.
                        lazy: async () => {
                            const { ModuleErrorBoundary } = await import("./ModuleErrorBoundary.tsx");

                            return {
                                errorElement: <ModuleErrorBoundary />
                            };
                        },
                        children: [
                            ProtectedRoutes
                        ]
                    }
                ]
            }
        ]
    }, {
        parentId: "root-layout"
    });

    runtime.registerPublicRoute({
        path: "/login",
        lazy: async () => {
            const { LoginPage } = await import("./LoginPage.tsx");

            return {
                element: <LoginPage host={host} />
            };
        }
    });

    runtime.registerPublicRoute({
        path: "/logout",
        lazy: async () => {
            const { LogoutPage } = await import("./LogoutPage.tsx");

            return {
                element: <LogoutPage host={host} />
            };
        }
    });

    runtime.registerPublicRoute({
        path: "*",
        lazy: async () => {
            const { NoMatchPage } = await import("./NoMatchPage.tsx");

            return {
                element: <NoMatchPage path={location.pathname} host={host} />
            };
        }
    });
}

async function registerMsw(runtime: FireflyRuntime) {
    if (runtime.isMswEnabled) {
        // Files including an import to the "msw" package are included dynamically to prevent adding
        // MSW stuff to the bundled when it's not used.
        const requestHandlers = (await import("../mocks/handlers.ts")).getRequestHandlers(runtime.environmentVariables);

        runtime.registerRequestHandlers(requestHandlers);
    }
}

function registerEnvironmentVariables(runtime: FireflyRuntime) {
    runtime.registerEnvironmentVariables({
        authenticationApiBaseUrl: "/api/auth/",
        userInfoApiBaseUrl: "http://localhost:1234/api/user-info/",
        userRoleApiBaseUrl: "/api/user-role/",
        sessionApiBaseUrl: "/api/session/",
        subscriptionApiBaseUrl: "/api/subscription/",
        dummyHandlerUrl: "/api/dummy"
    });
}

// Once the session is loaded, switch to the user preferred language. Awaiting the switch in a deferred registration
// applies it before the modules become ready, therefore before the first protected page is rendered. The rejection of
// a failed load reaches the "onError" callback of "useDeferredRegistrations", and the language is left unchanged.
function registerPreferredLanguage(runtime: FireflyRuntime): DeferredRegistrationFunction<FireflyRuntime, DeferredRegistrationData> {
    const i18nextPlugin = getI18nextPlugin(runtime) as i18nextPlugin<LanguageKey>;

    return async (_, data) => {
        // On an update run with an unchanged language, this resolves without notifying anyone.
        await i18nextPlugin.changeLanguage(data.session?.user.preferredLanguage ?? i18nextPlugin.currentLanguage);
    };
}

export function registerShell({ host }: RegisterShellOptions = {}) {
    const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = async runtime => {
        registerEnvironmentVariables(runtime);
        initI18next(runtime);

        await registerMsw(runtime);

        return mergeDeferredRegistrations([
            registerLayouts(runtime, { host }),
            registerRoutes(runtime, host),
            registerPreferredLanguage(runtime)
        ]);
    };

    return register;
}
