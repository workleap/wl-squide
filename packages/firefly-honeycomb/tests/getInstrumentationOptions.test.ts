import type { FetchInstrumentationConfig } from "@opentelemetry/instrumentation-fetch";
import { FireflyRuntime } from "@squide/firefly";
import { describe, test, vi } from "vitest";
import { __clearOverrideFetchRequestSpanWithActiveSpanContextMock, __setOverrideFetchRequestSpanWithActiveSpanContextMock } from "../src/activeSpan.ts";
import { getInstrumentationOptions } from "../src/registerHoneycombInstrumentation.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeInstrumentationVersionsForSnapshot(options: any) {
    if (Array.isArray(options.instrumentations)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options.instrumentations.forEach(x => {
            if (x["instrumentationVersion"]) {
                delete x["instrumentationVersion"];
            }

            if (x["version"]) {
                delete x["version"];
            }

            if (x["_logger"] && x["_logger"]["version"]) {
                delete x["_logger"]["version"];
            }

            if (x["_tracer"] && x["_tracer"]["version"]) {
                delete x["_tracer"]["version"];
            }
        });
    }

    return options;
}

test.concurrent("when debug is true", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const result = getInstrumentationOptions(runtime, {
        debug: true,
        apiKey: "123"
    });

    const cleanedResult = removeInstrumentationVersionsForSnapshot({
        ...result,
        fetchInstrumentation: result.fetchInstrumentation ? result.fetchInstrumentation({}) : undefined
    });

    expect(cleanedResult).toMatchSnapshot();
});

test.concurrent("when debug is false", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const result = getInstrumentationOptions(runtime, {
        debug: false,
        apiKey: "123"
    });

    const cleanedResult = removeInstrumentationVersionsForSnapshot({
        ...result,
        fetchInstrumentation: result.fetchInstrumentation ? result.fetchInstrumentation({}) : undefined
    });

    expect(cleanedResult).toMatchSnapshot();
});

test.concurrent("when the runtime mode is \"development\"", ({ expect }) => {
    const runtime = new FireflyRuntime({
        mode: "development"
    });

    const result = getInstrumentationOptions(runtime, {
        apiKey: "123"
    });

    const cleanedResult = removeInstrumentationVersionsForSnapshot({
        ...result,
        fetchInstrumentation: result.fetchInstrumentation ? result.fetchInstrumentation({}) : undefined
    });

    expect(cleanedResult).toMatchSnapshot();
});

test.concurrent("when the runtime mode is \"production\"", ({ expect }) => {
    const runtime = new FireflyRuntime({
        mode: "production"
    });

    const result = getInstrumentationOptions(runtime, {
        apiKey: "123"
    });

    const cleanedResult = removeInstrumentationVersionsForSnapshot({
        ...result,
        fetchInstrumentation: result.fetchInstrumentation ? result.fetchInstrumentation({}) : undefined
    });

    expect(cleanedResult).toMatchSnapshot();
});

describe("fetchInstrumentation", () => {
    test.concurrent("when fetchInstrumentation is false, return false", ({ expect }) => {
        const runtime = new FireflyRuntime();

        const result = getInstrumentationOptions(runtime, {
            fetchInstrumentation: false,
            apiKey: "123"
        });

        expect(result.fetchInstrumentation).toBe(false);
    });

    test.concurrent("when fetchInstrumentation is a function, call the function with the augmented options", ({ expect }) => {
        const runtime = new FireflyRuntime();

        const mock = vi.fn();

        const result = getInstrumentationOptions(runtime, {
            fetchInstrumentation: mock,
            apiKey: "123"
        });

        // Simulate calling the "registerHoneycombInstrumentation" function.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        result.fetchInstrumentation({});

        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(expect.objectContaining({
            requestHook: expect.any(Function)
        }));
    });

    test.concurrent("when fetchInstrumentation is not provided, requestHook is the active span override function", ({ expect }) => {
        const runtime = new FireflyRuntime();

        const result = getInstrumentationOptions(runtime, {
            apiKey: "123"
        });

        expect(result.fetchInstrumentation).toBeDefined();

        // Simulate calling the "registerHoneycombInstrumentation" function.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const fetchOptions = result.fetchInstrumentation({}) as FetchInstrumentationConfig;

        expect(fetchOptions.requestHook).toBeDefined();
    });

    test.concurrent("when the base honeycomb instrumentation library configure a default requestHook, merge the base function with the active span override function", ({ expect }) => {
        const runtime = new FireflyRuntime();

        const baseConfigMock = vi.fn();
        const activeSpanMock = vi.fn();

        __setOverrideFetchRequestSpanWithActiveSpanContextMock(activeSpanMock);

        const result = getInstrumentationOptions(runtime, {
            apiKey: "123"
        });

        // Simulate calling the "registerHoneycombInstrumentation" function.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { requestHook } = result.fetchInstrumentation({
            requestHook: baseConfigMock
        });

        requestHook();

        expect(baseConfigMock).toHaveBeenCalledTimes(1);
        expect(activeSpanMock).toHaveBeenCalledTimes(1);

        __clearOverrideFetchRequestSpanWithActiveSpanContextMock();
    });
});
