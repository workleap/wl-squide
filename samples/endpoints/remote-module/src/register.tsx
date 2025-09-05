import type { DeferredRegistrationData } from "@endpoints/shared";
import { getEnvironmentVariablesPlugin } from "@squide/env-vars";
import type { DeferredRegistrationFunction, FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";
import { I18nextNavigationItemLabel } from "@squide/i18next";
import type { i18n } from "i18next";
import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider.tsx";
import { initI18next } from "./i18next.ts";

interface ProvidersProps {
    children: ReactNode;
}

function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            {children}
        </QueryProvider>
    );
}

function registerRoutes(runtime: FireflyRuntime, i18nextInstance: i18n): DeferredRegistrationFunction<FireflyRuntime, DeferredRegistrationData> {
    runtime.registerPublicRoute({
        path: "/anonymous",
        lazy: async () => {
            const { AnonymousPage } = await import("./AnonymousPage.tsx");

            return {
                element: <Providers><AnonymousPage /></Providers>
            };
        }
    });

    runtime.registerRoute({
        path: "/federated-tabs/episodes",
        lazy: async () => {
            const { EpisodesTab } = await import("./EpisodesTab.tsx");

            return {
                element: <Providers><EpisodesTab /></Providers>
            };
        }
    }, {
        parentPath: "/federated-tabs"
    });

    runtime.registerRoute({
        path: "/federated-tabs/locations",
        lazy: async () => {
            const { LocationsTab } = await import("./LocationsTab.tsx");

            return {
                element: <Providers><LocationsTab /></Providers>
            };
        }
    }, {
        parentPath: "/federated-tabs"
    });

    runtime.registerRoute({
        path: "/federated-tabs/failing",
        lazy: async () => {
            const { FailingTab } = await import("./FailingTab.tsx");

            return {
                element: <Providers><FailingTab /></Providers>
            };
        }
    }, {
        parentPath: "/federated-tabs"
    });

    runtime.registerRoute({
        path: "/feature-b",
        lazy: async () => {
            const { FeatureBPage } = await import("./FeatureBPage.tsx");

            return {
                element: <Providers><FeatureBPage /></Providers>
            };
        }
    });

    runtime.registerRoute({
        path: "/feature-c",
        lazy: async () => {
            const { FeatureCPage } = await import("./FeatureCPage.tsx");

            return {
                element: <Providers><FeatureCPage /></Providers>
            };
        }
    });

    runtime.registerNavigationItem({
        $id: "episodes-tab",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="episodesTab" />,
        to: "/federated-tabs/episodes"
    }, {
        menuId: "/federated-tabs"
    });

    runtime.registerNavigationItem({
        $id: "locations-tab",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="locationsTab" />,
        to: "/federated-tabs/locations"
    }, {
        menuId: "/federated-tabs"
    });

    runtime.registerNavigationItem({
        $id: "failing-tab",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="failingTab" />,
        to: "/federated-tabs/failing"
    }, {
        menuId: "/federated-tabs"
    });

    return (deferredRuntime, { featureFlags }) => {
        if (featureFlags?.featureB) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-b",
                $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="featureBPage" />,
                to: "/feature-b"
            });
        }

        if (featureFlags?.featureC) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-c",
                $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="featureCPage" />,
                to: "/feature-c"
            });
        }
    };
}

async function registerMsw(runtime: FireflyRuntime) {
    if (runtime.isMswEnabled) {
        const environmentVariables = getEnvironmentVariablesPlugin(runtime).getVariables();

        // Files including an import to the "msw" package are included dynamically to prevent adding
        // MSW stuff to the bundled when it's not used.
        const requestHandlers = (await import("../mocks/handlers.ts")).getRequestHandlers(environmentVariables);

        runtime.registerRequestHandlers(requestHandlers);
    }
}

function registerEnvironmentVariables(runtime: FireflyRuntime) {
    const plugin = getEnvironmentVariablesPlugin(runtime);

    plugin.registerVariables({
        rickAndMortyApiBaseUrl: "/api/r&m/",
        featureApiBaseUrl: "/api/feature/"
    });
}

export const register: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = async runtime => {
    registerEnvironmentVariables(runtime);

    const i18nextInstance = initI18next(runtime);

    await registerMsw(runtime);

    return registerRoutes(runtime, i18nextInstance);
};
