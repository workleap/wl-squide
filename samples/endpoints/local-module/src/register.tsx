import type { DeferredRegistrationData } from "@endpoints/shared";
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
    runtime.registerRoute({
        path: "/subscription",
        lazy: async () => {
            const { SubscriptionPage } = await import("./SubscriptionPage.tsx");

            return {
                element: <Providers><SubscriptionPage /></Providers>
            };
        }
    });

    runtime.registerRoute({
        index: true,
        lazy: async () => {
            const { CharactersTab } = await import("./CharactersTab.tsx");

            return {
                element: <Providers><CharactersTab /></Providers>
            };
        }
    }, {
        parentPath: "/federated-tabs"
    });

    runtime.registerRoute({
        path: "/feature-a",
        lazy: async () => {
            const { FeatureAPage } = await import("./FeatureAPage.tsx");

            return {
                element: <Providers><FeatureAPage /></Providers>
            };
        }
    });

    runtime.registerNavigationItem({
        $id: "subscription",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="subscriptionPage" />,
        to: "/subscription"
    });

    runtime.registerNavigationItem({
        $id: "characters-tab",
        $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="charactersTab" />,
        to: "/federated-tabs"
    }, {
        menuId: "/federated-tabs"
    });

    return (deferredRuntime, { role }) => {
        if (role === "admin" && deferredRuntime.getFeatureFlag("enable-feature-a", true)) {
            deferredRuntime.registerNavigationItem({
                $id: "feature-a",
                $label: <I18nextNavigationItemLabel i18next={i18nextInstance} resourceKey="featureAPage" />,
                to: "/feature-a"
            });
        }
    };
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
        rickAndMortyApiBaseUrl: "/api/r&m/",
        featureApiBaseUrl: "/api/feature/"
    });
}

export const registerLocalModule: ModuleRegisterFunction<FireflyRuntime, unknown, DeferredRegistrationData> = async runtime => {
    registerEnvironmentVariables(runtime);

    const i18nextInstance = initI18next(runtime);

    await registerMsw(runtime);

    return registerRoutes(runtime, i18nextInstance);
};
