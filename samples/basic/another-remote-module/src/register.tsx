import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from "useless-lib";

console.log("[basic-sample] another-remote-module:", version);

function registerRoutes(runtime: FireflyRuntime) {
    runtime.registerRoute({
        path: "/federated-tabs/officevibe",
        lazy: () => import("./OfficevibeTab.tsx")
    }, {
        parentPath: "/federated-tabs"
    });

    runtime.registerNavigationItem({
        $label: "Officevibe",
        to: "/federated-tabs/officevibe"
    }, {
        menuId: "/federated-tabs"
    });

    // Register nested navigation link

    runtime.registerNavigationItem({
        $label: "Child 3",
        to: "#"
    }, {
        sectionId: "section"
    });
}

export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    return registerRoutes(runtime);
};
