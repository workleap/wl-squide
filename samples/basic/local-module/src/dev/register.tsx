import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";
import { DevHome } from "./DevHome.tsx";

export const registerDev: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        index: true,
        element: <DevHome />
    });

    // The module registers a navigation item under this section, which is registered by another module
    // in the host application.
    runtime.registerNavigationItem({
        $id: "section",
        $label: "Section",
        children: []
    });
};
