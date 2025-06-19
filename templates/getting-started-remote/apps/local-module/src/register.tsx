import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";
import { Page } from "./Page.tsx";

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        path: "/local/page",
        element: <Page />
    });

    runtime.registerNavigationItem({
        $id: "local-page",
        $label: "Local/Page",
        to: "/local/page"
    });
};
