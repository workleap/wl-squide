import { ModuleRegistrationError, toLocalModuleDefinitions } from "@squide/core";
import { MswPlugin } from "@squide/msw";
import { MswState } from "@squide/msw/internal";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { ApplicationBootstrappingStartedEvent, bootstrap } from "../src/initializeFirefly.ts";

test.concurrent("filter out undefined definitions", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const listener = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, listener);

    bootstrap(runtime, [
        undefined,
        ...toLocalModuleDefinitions([
            () => {}
        ])
    ]);

    await vi.waitFor(() => expect(runtime.moduleManager.getAreModulesReady()).toBeTruthy());
});

test.concurrent("dispatch ApplicationBootstrappingStartedEvent", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const listener = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, listener);

    bootstrap(runtime, []);

    await vi.waitFor(() => expect(listener).toHaveBeenCalledOnce());
});

test.concurrent("when local modules are provided, register the local modules", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    bootstrap(runtime, toLocalModuleDefinitions([
        () => {}
    ]));

    await vi.waitFor(() => expect(runtime.moduleManager.getAreModulesReady()).toBeTruthy());
});

test.concurrent("when an error occurs while registering a local and an onError function is provided, call the function with the error", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onError = vi.fn();

    bootstrap(runtime, toLocalModuleDefinitions([
        () => {
            throw new Error("Dummy");
        }
    ]), {
        onError
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError).toHaveBeenCalledWith(expect.any(ModuleRegistrationError));
});

test.concurrent("when MSW is enabled and a start function is provided, call the start function", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        plugins: [x => new MswPlugin(x)],
        loggers: [new NoopLogger()]
    });

    const fct = vi.fn(() => Promise.resolve());

    bootstrap(runtime, [], {
        startMsw: fct
    });

    await vi.waitFor(() => expect(fct).toHaveBeenCalledOnce());
});

test.concurrent("when MSW is disabled and a start function is provided, do not call the start function", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const fct = vi.fn(() => Promise.resolve());

    bootstrap(runtime, [], {
        startMsw: fct
    });

    expect(fct).not.toHaveBeenCalled();
});

// test("when MSW is enabled and no start function has been provided, throw an error", async () => {
//     const runtime = new FireflyRuntime({
//         useMsw: true
//     });

//     await vi.waitFor(() => expect(() => bootstrap(runtime)).toThrow(/When MSW is enabled, the "startMsw" function must be provided/));
// });

test.concurrent("when MSW is enabled and a start function is provided, MSW is ready once the start function is called", async ({ expect }) => {
    const mswState = new MswState();

    const runtime = new FireflyRuntime({
        plugins: [x => new MswPlugin(x, {
            state: mswState
        })],
        loggers: [new NoopLogger()]
    });

    bootstrap(runtime, [], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitFor(() => expect(mswState.isReady).toBeTruthy());
});
