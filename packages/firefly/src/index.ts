export * from "@squide/core";
export * from "@squide/msw";
export * from "@squide/react-router";

export type { FireflyPlugin } from "./FireflyPlugin.ts";
export * from "./FireflyProvider.tsx";
export * from "./FireflyRuntime.tsx";

export * from "./AppRouter.tsx";
export * from "./AppRouterContext.ts";
export * from "./AppRouterReducer.ts";

export * from "./AppRouterStore.ts";
export * from "./GlobalDataQueriesError.ts";
export * from "./useCanFetchProtectedData.ts";
export * from "./useCanFetchPublicData.ts";
export * from "./useCanRegisterDeferredRegistrations.ts";
export * from "./useCanUpdateDeferredRegistrations.ts";
export * from "./useDeferredRegistrations.ts";
export * from "./useIsActiveRouteProtected.ts";
export * from "./useIsBootstrapping.ts";
export * from "./useNavigationItems.ts";
export * from "./useProtectedDataHandler.ts";
export * from "./useProtectedDataQueries.ts";
export * from "./usePublicDataHandler.ts";
export * from "./usePublicDataQueries.ts";
export * from "./useRegisterDeferredRegistrations.ts";
export * from "./useStrictRegistrationMode.ts";
export * from "./useUpdateDeferredRegistrations.ts";

export * from "./initializeFirefly.ts";

export type { ActiveSpan, ActiveSpanId } from "./honeycomb/activeSpan.ts";
export { addProtectedListener, type AddProtectedListenerOptions, type GetSpanFunction, type HoneycombTrackingUnmanagedErrorHandler } from "./honeycomb/registerHoneycombInstrumentation.ts";
export { getTracer } from "./honeycomb/tracer.ts";
export {
    endActiveSpan,
    startActiveChildSpan,
    startActiveSpan,
    startChildSpan,
    startSpan,
    traceError,
    type StartActiveChildSpanFactory,
    type StartActiveChildSpanFactoryReturn,
    type StartActiveSpanFactory,
    type StartActiveSpanFactoryReturn,
    type StartChildSpanFactory,
    type StartSpanFactory,
    type TraceErrorOptions
} from "./honeycomb/utils.ts";

