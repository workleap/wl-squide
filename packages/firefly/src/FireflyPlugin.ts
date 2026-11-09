import type { Plugin } from "@squide/core";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";
import type { GetSpanFunction, HoneycombTrackingUnmanagedErrorHandler } from "./honeycomb/registerHoneycombInstrumentation.ts";

export interface FireflyPlugin extends Plugin<FireflyRuntime> {
    registerHoneycombTrackingListeners?: (
        getBootstrappingSpan: GetSpanFunction,
        getDeferredRegistrationsUpdateSpan: GetSpanFunction,
        onUnmanagedError: HoneycombTrackingUnmanagedErrorHandler
    ) => HoneycombTrackingUnmanagedErrorHandler;
}
