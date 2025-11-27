import { ProtectedRoutes, PublicRoutes, type FireflyRuntime, type ModuleRegisterFunction } from "@squide/firefly";
import { HomePage } from "./HomePage.tsx";

async function registerMsw(runtime: FireflyRuntime) {
    if (runtime.isMswEnabled) {
        // Files including an import to the "msw" package are included dynamically to prevent adding
        // MSW stuff to the bundle when it's not used.
        const requestHandlers = (await import("./apiMocks/getRequestHandlers.ts")).getRequestHandlers(runtime.getEnvironmentVariables());

        runtime.registerRequestHandlers(requestHandlers);
    }
}

function registerRoutes(runtime: FireflyRuntime) {
    runtime.registerRoute({
        children: [
            PublicRoutes,
            ProtectedRoutes
        ]
    }, {
        hoist: true
    });

    runtime.registerRoute({
        index: true,
        element: <HomePage />
    });

    runtime.registerNavigationItem({
        $priority: 1000,
        $label: "Home",
        to: "/"
    });
}

export const registerHost: ModuleRegisterFunction<FireflyRuntime> = async runtime => {
    await registerMsw(runtime);
    registerRoutes(runtime);
};
