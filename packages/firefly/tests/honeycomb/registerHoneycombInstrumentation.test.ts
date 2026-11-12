import { Plugin } from "@squide/core";
import type { FetchRequestHookFunction } from "@workleap-telemetry/core";
import { NoopLogger } from "@workleap/logging";
import { afterEach, test, vi } from "vitest";
import { IsUnauthorizedEvent, ProtectedDataReadyEvent } from "../../src/AppRouterReducer.ts";
import type { FireflyPlugin } from "../../src/FireflyPlugin.ts";
import { FireflyRuntime } from "../../src/FireflyRuntime.tsx";
import { type HoneycombTrackingUnmanagedErrorHandler, registerHoneycombInstrumentation } from "../../src/honeycomb/registerHoneycombInstrumentation.ts";
import { ApplicationBootstrappingStartedEvent } from "../../src/initializeFirefly.ts";
import { ProtectedDataFetchFailedEvent, ProtectedDataFetchStartedEvent } from "../../src/useProtectedDataQueries.ts";

const { startSpan } = vi.hoisted(() => ({
    startSpan: vi.fn()
}));

vi.mock("../../src/honeycomb/tracer.ts", () => ({
    getTracer: () => ({
        startSpan
    })
}));

function createSpan() {
    return {
        end: vi.fn(),
        addEvent: vi.fn(),
        recordException: vi.fn(),
        setStatus: vi.fn(),
        setAttribute: vi.fn(),
        spanContext: () => ({
            traceId: "0af7651916cd43dd8448eb211c80319c",
            spanId: "b7ad6b7169203331",
            traceFlags: 1
        })
    };
}

class UnmanagedErrorPlugin extends Plugin<FireflyRuntime> implements FireflyPlugin {
    onUnmanagedError?: HoneycombTrackingUnmanagedErrorHandler;

    constructor(runtime: FireflyRuntime) {
        super("unmanaged-error-plugin", runtime);
    }

    registerHoneycombTrackingListeners(_getBootstrappingSpan: unknown, _getDeferredRegistrationsUpdateSpan: unknown, onUnmanagedError: HoneycombTrackingUnmanagedErrorHandler) {
        this.onUnmanagedError = onUnmanagedError;

        return () => {};
    }
}

function registerInstrumentation(logger = new NoopLogger()) {
    const spans: Record<string, ReturnType<typeof createSpan>> = {};

    startSpan.mockImplementation((name: string) => {
        spans[name] = createSpan();

        return spans[name];
    });

    let fetchRequestHook: FetchRequestHookFunction | undefined;

    const runtime = new FireflyRuntime({
        loggers: [logger],
        plugins: [x => new UnmanagedErrorPlugin(x)],
        honeycombInstrumentationClient: {
            registerFetchRequestHook: hook => {
                fetchRequestHook = hook;
            },
            registerFetchRequestHookAtStart: () => {}
        }
    });

    registerHoneycombInstrumentation(runtime);

    const executeFetchRequestHook = (request: RequestInit = {}) => fetchRequestHook?.(createSpan(), request);

    return {
        runtime,
        spans,
        plugin: runtime.plugins[0] as UnmanagedErrorPlugin,
        executeFetchRequestHook,
        // Whether or not a fetch request would currently be nested under a squide active span.
        hasActiveSpan: () => executeFetchRequestHook() === true
    };
}

// The active span stack is registered on globalThis, the tests of this file cannot be executed concurrently.
afterEach(() => {
    // @ts-expect-error The variable is not typed.
    delete globalThis.__SQUIDE_HONEYCOMB_ACTIVE_SPAN_STACK__;
});

test("when a fetch request is nested under the active span, the request is not logged", ({ expect }) => {
    const logger = new NoopLogger();
    const withObjectSpy = vi.spyOn(logger, "withObject");

    const { runtime, executeFetchRequestHook } = registerInstrumentation(logger);

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    const request = {
        headers: {
            Authorization: "Bearer 123"
        }
    };

    expect(executeFetchRequestHook(request)).toBeTruthy();

    const loggedObjects: unknown[] = withObjectSpy.mock.calls.flat();

    expect(loggedObjects).not.toHaveLength(0);
    expect(loggedObjects).not.toContain(request);
});

test("when the protected data is ready, the data fetch span is ended and is not the active span anymore", ({ expect }) => {
    const { runtime, spans, hasActiveSpan } = registerInstrumentation();

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(hasActiveSpan()).toBeTruthy();

    runtime.eventBus.dispatch(ProtectedDataReadyEvent, { waitForMsw: false, waitForPublicData: false, waitForProtectedData: true });

    expect(spans["data-fetch"].end).toHaveBeenCalledOnce();
    expect(hasActiveSpan()).toBeFalsy();
});

test("when a protected data query is unauthorized, the data fetch span is not the active span anymore", ({ expect }) => {
    const { runtime, spans, hasActiveSpan } = registerInstrumentation();

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(hasActiveSpan()).toBeTruthy();

    runtime.eventBus.dispatch(IsUnauthorizedEvent, { waitForMsw: false, waitForPublicData: false, waitForProtectedData: true });

    expect(spans["data-fetch"].end).not.toHaveBeenCalled();
    expect(hasActiveSpan()).toBeFalsy();
});

test("when a protected data query is unauthorized and another one fails, the error is traced on the data fetch span and the span is ended", ({ expect }) => {
    const { runtime, spans, hasActiveSpan } = registerInstrumentation();

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);
    runtime.eventBus.dispatch(IsUnauthorizedEvent, { waitForMsw: false, waitForPublicData: false, waitForProtectedData: true });
    runtime.eventBus.dispatch(ProtectedDataFetchFailedEvent, [new Error("Failed")]);

    expect(spans["data-fetch"].recordException).toHaveBeenCalledOnce();
    expect(spans["data-fetch"].end).toHaveBeenCalledOnce();
    expect(spans["squide-bootstrapping"].end).toHaveBeenCalledOnce();
    expect(hasActiveSpan()).toBeFalsy();
});

test("when an unmanaged error is reported while fetching data, the data fetch span is ended and is not the active span anymore", ({ expect }) => {
    const { runtime, spans, plugin, hasActiveSpan } = registerInstrumentation();

    runtime.eventBus.dispatch(ApplicationBootstrappingStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(hasActiveSpan()).toBeTruthy();

    plugin.onUnmanagedError?.(new Error("Unmanaged"));

    expect(spans["data-fetch"].end).toHaveBeenCalledOnce();
    expect(hasActiveSpan()).toBeFalsy();
});
