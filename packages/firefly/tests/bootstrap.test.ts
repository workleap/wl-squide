import { __clearLocalModuleRegistry, __setLocalModuleRegistry, LocalModuleRegistry } from "@squide/core";
import { __clearRemoteModuleRegistry, __setRemoteModuleRegistry, RemoteModuleRegistry } from "@squide/module-federation";
import { __clearMswState, __setMswState, MswState } from "@squide/msw";
import { __resetHasExecuteGuard, ApplicationBootstrappingStartedEvent, bootstrap } from "../src/boostrap.ts";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";

afterEach(() => {
    __resetHasExecuteGuard();
    __clearLocalModuleRegistry();
    __clearRemoteModuleRegistry();
    __clearMswState();
});

test("dispatch ApplicationBootstrappingStartedEvent", async () => {
    const runtime = new FireflyRuntime();

    const listener = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, listener);

    await bootstrap(runtime);

    expect(listener).toHaveBeenCalledTimes(1);
});

test("when local modules are provided, register the local modules", async () => {
    const runtime = new FireflyRuntime();
    const localModuleRegistry = new LocalModuleRegistry();

    __setLocalModuleRegistry(localModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
            () => {}
        ]
    });

    expect(localModuleRegistry.registrationStatus).toBe("ready");
});

test("when remote modules are provided, register the remote modules", async () => {
    const runtime = new FireflyRuntime();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        remotes: [
            { name: "Dummy-1" }
        ]
    });

    expect(remoteModuleRegistry.registrationStatus).toBe("ready");
});

test("when local and remote modules are provided, register all the modules", async () => {
    const runtime = new FireflyRuntime();
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
            () => {}
        ],
        remotes: [
            { name: "Dummy-1" }
        ]
    });

    expect(localModuleRegistry.registrationStatus).toBe("ready");
    expect(remoteModuleRegistry.registrationStatus).toBe("ready");
});

test("when an error occurs while registering a local module, return the error", async () => {
    const runtime = new FireflyRuntime();
    const localModuleRegistry = new LocalModuleRegistry();

    __setLocalModuleRegistry(localModuleRegistry);

    const { localModuleErrors, remoteModuleErrors } = await bootstrap(runtime, {
        localModules: [
            () => {
                throw new Error("Dummy");
            }
        ]
    });

    expect(localModuleErrors.length).toBe(1);
    expect(localModuleErrors[0].error.message).toBe("Dummy");
    expect(remoteModuleErrors.length).toBe(0);
});

test("when an error occurs while registering a remote module, return the error", async () => {
    const runtime = new FireflyRuntime();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => {
            throw new Error("Dummy");
        }
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setRemoteModuleRegistry(remoteModuleRegistry);

    const { localModuleErrors, remoteModuleErrors } = await bootstrap(runtime, {
        remotes: [
            { name: "Dummy-1" }
        ]
    });

    expect(remoteModuleErrors.length).toBe(1);
    expect(remoteModuleErrors[0].error.message).toBe("Dummy");
    expect(localModuleErrors.length).toBe(0);
});

test("when MSW is enabled and a start function is provided, call the start function", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const fct = jest.fn(() => Promise.resolve());

    await bootstrap(runtime, {
        startMsw: fct
    });

    expect(fct).toHaveBeenCalledTimes(1);
});

test("when MSW is disabled and a start function is provided, do not call the start function", async () => {
    const runtime = new FireflyRuntime({
        useMsw: false
    });

    const fct = jest.fn(() => Promise.resolve());

    await bootstrap(runtime, {
        startMsw: fct
    });

    expect(fct).not.toHaveBeenCalled();
});

test("when MSW is enabled and no start function has been provided, throw an error", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    await expect(async () => await bootstrap(runtime)).rejects.toThrow(/When MSW is enabled, the "startMsw" function must be provided/);
});

test("when MSW is enabled, MSW is ready", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const mswState = new MswState();

    __setMswState(mswState);

    await bootstrap(runtime, {
        startMsw: jest.fn(() => Promise.resolve())
    });

    expect(mswState.isReady).toBeTruthy();
});

test("when MSW is disabled, MSW is not ready", async () => {
    const runtime = new FireflyRuntime({
        useMsw: false
    });

    const mswState = new MswState();

    __setMswState(mswState);

    await bootstrap(runtime, {
        startMsw: jest.fn(() => Promise.resolve())
    });

    expect(mswState.isReady).toBeFalsy();
});
