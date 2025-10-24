import type { FireflyRuntime } from "../FireflyRuntime.tsx";

export async function initializeHoneycomb(runtime: FireflyRuntime) {
    if (runtime.honeycombInstrumentationClient) {
        try {
            // Dynamically import the Honeycomb instrumentation to prevent loading all the Honeycomb libraries
            // if Honeycomb instrumentation is not registered by the hosting application.
            const mod = await import("./registerHoneycombInstrumentation.ts");

            mod.registerHoneycombInstrumentation(runtime);
        } catch (error: unknown) {
            runtime.logger.error("[squide] Failed to register Honeycomb instrumentation. The \"./registerHoneycombInstrumentation.ts\" file cannot be imported.");

            throw error;
        }
    } else {
        runtime.logger.information("[squide] Cannot register Honeycomb instrumentation because the host application hasn't provided a client.");
    }
}
