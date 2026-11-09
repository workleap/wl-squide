import { ProtectedRoutes, PublicRoutes, type FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";

export interface RegisterShellOptions {
    // This is only for demo purposed, do not copy this.
    host?: string;
}

function registerRoutes(runtime: FireflyRuntime, host?: string) {
    runtime.registerPublicRoute(
        {
            // Pathless route to declare a root layout and a root error boundary.
            $id: "root-layout",
            element: <RootLayout />,
            children: [PublicRoutes]
        },
        {
            hoist: true
        }
    );

    runtime.registerRoute(
        {
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
                            lazy: () => import("./ModuleErrorBoundary.tsx"),
                            children: [ProtectedRoutes]
                        }
                    ]
                }
            ]
        },
        {
            parentId: "root-layout"
        }
    );

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

export function registerShell({ host }: RegisterShellOptions = {}) {
    const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
        return registerRoutes(runtime, host);
    };

    return register;
}
