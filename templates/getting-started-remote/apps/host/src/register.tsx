import { ProtectedRoutes, PublicRoutes, type FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";
import { RootLayout } from "./RootLayout.tsx";

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        // Pathless route to declare a root layout.
        element: <RootLayout />,
        children: [
            // Placeholder to indicate where managed routes (routes that are not hoisted or nested)
            // will be rendered.
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerPublicRoute({
        path: "*",
        element: <NotFoundPage />
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });
};
