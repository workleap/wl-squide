import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";
import { DevHomePage } from "./DevHomePage.tsx";

export const registerDev: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerRoute({
        index: true,
        element: <DevHomePage />
    });
};
