import type { FireflyRuntime } from "../FireflyRuntime.tsx";
import { canRegisterHoneycombInstrumentation } from "./canRegisterHoneycombInstrumentation.ts";

export async function initializeHoneycomb(runtime: FireflyRuntime) {
    if (canRegisterHoneycombInstrumentation()) {
        try {
            // Dynamically import the Honeycomb instrumentation to prevent loading all the Honeycomb libraries
            // if Honeycomb instrumentation is not registered by the hosting application.
            const mod = await import("./registerHoneycombInstrumentation.ts");

            mod.registerHoneycombInstrumentation(runtime);
        } catch (error: unknown) {
            runtime.logger.error("[squide] Failed to register Honeycomb instrumentation. The \"./registerHoneycombInstrumentation.ts\" cannot be imported.");

            throw error;
        }
    } else {
        runtime.logger.debug("[squide] Cannot register Honeycomb instrumentation because the host application is not using the \"@workleap/honeycomb\" package.");
    }
}


