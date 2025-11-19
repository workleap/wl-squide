import { Plugin } from "@squide/core";
import { FireflyRuntime } from "./FireflyRuntime.tsx";
import { GetSpanFunction, HoneycombTrackingUnmanagedErrorHandler } from "./honeycomb/registerHoneycombInstrumentation.ts";

export interface FireflyPlugin extends Plugin<FireflyRuntime> {
    registerHoneycombTrackingListeners?: (
        getBootstrappingSpan: GetSpanFunction,
        getDeferredRegistrationsUpdateSpan: GetSpanFunction,
        onUnmanagedError: HoneycombTrackingUnmanagedErrorHandler
    ) => HoneycombTrackingUnmanagedErrorHandler;
}
