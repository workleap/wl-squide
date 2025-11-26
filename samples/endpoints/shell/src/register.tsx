import { registerLayouts } from "@endpoints/layouts";
import { mergeDeferredRegistrations, ProtectedRoutes, PublicRoutes, type FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";
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
        const environmentVariables = runtime.getEnvironmentVariables();

        // Files including an import to the "msw" package are included dynamically to prevent adding
        // MSW stuff to the bundled when it's not used.
        const requestHandlers = (await import("../mocks/handlers.ts")).getRequestHandlers(environmentVariables);

        runtime.registerRequestHandlers(requestHandlers);
    }
}

function registerEnvironmentVariables(runtime: FireflyRuntime) {
    runtime.registerEnvironmentVariables({
        authenticationApiBaseUrl: "/api/auth/",
        featureFlagsApiBaseUrl: "/api/flags/",
        otherFeatureFlagsApiUrl: "http://localhost:1234/api/otherFeatureFlags",
        sessionApiBaseUrl: "/api/session/",
        subscriptionApiBaseUrl: "/api/subscription/"
    });
}

export function registerShell({ host }: RegisterShellOptions = {}) {
    const register: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
        registerEnvironmentVariables(runtime);
        initI18next(runtime);

        await registerMsw(runtime);

        return mergeDeferredRegistrations([
            registerLayouts(runtime, { host }),
            registerRoutes(runtime, host)
        ]);
    };

    return register;
}
