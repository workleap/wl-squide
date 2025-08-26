import { __clearLocalModuleRegistry, __setLocalModuleRegistry, LocalModuleRegistry, ModuleRegistrationError } from "@squide/core";
import { __clearRemoteModuleRegistry, __setRemoteModuleRegistry, RemoteModuleRegistrationError, RemoteModuleRegistry } from "@squide/module-federation";
import { __clearMswState, __setMswState, MswState } from "@squide/msw";
import { NoopLogger } from "@workleap/logging";
import { afterEach, expect, test, vi } from "vitest";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { ApplicationBootstrappingStartedEvent, bootstrap } from "../src/initializeFirefly.ts";

afterEach(() => {
    __clearLocalModuleRegistry();
    __clearRemoteModuleRegistry();
    __clearMswState();
});

test("dispatch ApplicationBootstrappingStartedEvent", async () => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const listener = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, listener);

    bootstrap(runtime);

    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});

test("when local modules are provided, register the local modules", async () => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const localModuleRegistry = new LocalModuleRegistry();

    __setLocalModuleRegistry(localModuleRegistry);

    bootstrap(runtime, {
        localModules: [
            () => {}
        ]
    });

    await vi.waitFor(() => expect(localModuleRegistry.registrationStatus).toBe("ready"));
});

test("when remote modules are provided, register the remote modules", async () => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setRemoteModuleRegistry(remoteModuleRegistry);

    bootstrap(runtime, {
        remotes: [
            { name: "Dummy-1" }
        ]
    });

    await vi.waitFor(() => expect(remoteModuleRegistry.registrationStatus).toBe("ready"));
});

test("when local and remote modules are provided, register all the modules", async () => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    bootstrap(runtime, {
        localModules: [
            () => {}
        ],
        remotes: [
            { name: "Dummy-1" }
        ]
    });

    await vi.waitFor(() => expect(localModuleRegistry.registrationStatus).toBe("ready"));
    await vi.waitFor(() => expect(remoteModuleRegistry.registrationStatus).toBe("ready"));
});

test("when an error occurs while registering a local and an onError function is provided, call the function with the error", async () => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const localModuleRegistry = new LocalModuleRegistry();

    __setLocalModuleRegistry(localModuleRegistry);

    const onError = vi.fn();

    bootstrap(runtime, {
        localModules: [
            () => {
                throw new Error("Dummy");
            }
        ],
        onError
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(expect.any(ModuleRegistrationError));
});

test("when an error occurs while registering a remote module and an onError function is provided, call the function with the error", async () => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {
            throw new Error("Dummy");
        }
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setRemoteModuleRegistry(remoteModuleRegistry);

    const onError = vi.fn();

    bootstrap(runtime, {
        remotes: [
            { name: "Dummy-1" }
        ],
        onError
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(expect.any(RemoteModuleRegistrationError));
});

test("when MSW is enabled and a start function is provided, call the start function", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true,
        loggers: [new NoopLogger()]
    });

    const fct = vi.fn(() => Promise.resolve());

    bootstrap(runtime, {
        startMsw: fct
    });

    await vi.waitFor(() => expect(fct).toHaveBeenCalledTimes(1));
});

test("when MSW is disabled and a start function is provided, do not call the start function", () => {
    const runtime = new FireflyRuntime({
        useMsw: false,
        loggers: [new NoopLogger()]
    });

    const fct = vi.fn(() => Promise.resolve());

    bootstrap(runtime, {
        startMsw: fct
    });

    expect(fct).not.toHaveBeenCalled();
});

// eslint-disable-next-line jest/no-commented-out-tests
// test("when MSW is enabled and no start function has been provided, throw an error", async () => {
//     const runtime = new FireflyRuntime({
//         useMsw: true
//     });

//     await vi.waitFor(() => expect(() => bootstrap(runtime)).toThrow(/When MSW is enabled, the "startMsw" function must be provided/));
// });

test("when MSW is enabled and a start function is provided, MSW is ready once the start function is called", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true,
        loggers: [new NoopLogger()]
    });

    const mswState = new MswState();

    __setMswState(mswState);

    bootstrap(runtime, {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitFor(() => expect(mswState.isReady).toBeTruthy());
});
