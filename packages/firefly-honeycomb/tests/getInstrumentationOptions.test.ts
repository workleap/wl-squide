import type { FetchInstrumentationConfig } from "@opentelemetry/instrumentation-fetch";
import { FireflyRuntime } from "@squide/firefly";
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

test("when debug is true", () => {
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

test("when debug is false", () => {
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

test("when the runtime mode is \"development\"", () => {
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

test("when the runtime mode is \"production\"", () => {
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
    test("when fetchInstrumentation is false, return false", () => {
        const runtime = new FireflyRuntime();

        const result = getInstrumentationOptions(runtime, {
            fetchInstrumentation: false,
            apiKey: "123"
        });

        expect(result.fetchInstrumentation).toBe(false);
    });

    test("when fetchInstrumentation is a function, call the function with the augmented options", () => {
        const runtime = new FireflyRuntime();

        const mock = jest.fn();

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

    test("when fetchInstrumentation is not provided, requestHook is the active span override function", () => {
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

    test("when the base honeycomb instrumentation library configure a default requestHook, merge the base function with the active span override function", () => {
        const runtime = new FireflyRuntime();

        const baseConfigMock = jest.fn();
        const activeSpanMock = jest.fn();

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
