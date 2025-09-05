import { Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { RemoteModuleDeferredRegistrationUpdateFailedEvent, RemoteModuleRegistrationError, RemoteModuleRegistry, RemoteModulesDeferredRegistrationsUpdateCompletedEvent, RemoteModulesDeferredRegistrationsUpdateStartedEvent } from "../src/registerRemoteModules.ts";

function simulateDelay(delay: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, delay);
    });
}

class DummyRuntime extends Runtime {
    registerRoute() {
        throw new Error("Method not implemented.");
    }

    registerPublicRoute() {
        throw new Error("Method not implemented.");
    }

    get routes() {
        return [];
    }

    registerNavigationItem() {
        throw new Error("Method not implemented.");
    }

    getNavigationItems() {
        return [];
    }

    startDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    completeDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    startScope(): Runtime {
        return new DummyRuntime({ loggers: [new NoopLogger()] });
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

test.concurrent("when called before registerLocalModules, throw an error", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const loadRemote = vi.fn();

    const registry = new RemoteModuleRegistry(loadRemote);

    await expect(() => registry.updateDeferredRegistrations({}, runtime)).rejects.toThrow(/The updateDeferredRegistrations function can only be called once the remote modules are ready/);
});

test.concurrent("when called before registerLocalModuleDeferredRegistrations, throw an error", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    await expect(() => registry.updateDeferredRegistrations({}, runtime)).rejects.toThrow(/The updateDeferredRegistrations function can only be called once the remote modules are ready/);
});

test.concurrent("should dispatch RemoteModulesDeferredRegistrationsUpdateStartedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationsUpdateStartedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);
    await registry.updateDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        registrationCount: 2
    }));
});

test.concurrent("should update all the deferred registrations", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const register1 = vi.fn();
    const register2 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    register1.mockReset();
    register2.mockReset();
    register3.mockReset();

    await registry.updateDeferredRegistrations({}, runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalled();
    expect(register2).toHaveBeenCalled();
    expect(register3).toHaveBeenCalled();
});

test.concurrent("when all deferred registrations has been updated, RemoteModulesDeferredRegistrationsUpdateCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationsUpdateCompletedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);
    await registry.updateDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        registrationCount: 2
    }));
});

test.concurrent("when a deferred registration is asynchronous, the function can be awaited", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    let hasBeenCompleted = false;

    const register1 = vi.fn();

    const register2 = vi.fn()
        // Do not wait on the "registerDeferredRegistrations" call but wait on the "updateDeferredRegistrations" call.
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(async () => {
            await simulateDelay(10);

            hasBeenCompleted = true;
        });

    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    await registry.updateDeferredRegistrations({}, runtime);

    expect(hasBeenCompleted).toBeTruthy();
});

test.concurrent("when a deferred registration fail, update the remaining deferred registrations", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const register1 = vi.fn();

    const register2 = vi.fn()
        // Do not wait on the "registerDeferredRegistrations" call but wait on the "updateDeferredRegistrations" call.
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
            throw new Error("Module 2 registration failed");
        });

    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });


    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    register1.mockReset();
    register3.mockReset();

    await registry.updateDeferredRegistrations({}, runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalled();
    expect(register3).toHaveBeenCalled();
});

test.concurrent("when a deferred registration fail, return the error", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const register1 = vi.fn();

    const register2 = vi.fn()
        // Do not wait on the "registerDeferredRegistrations" call but wait on the "updateDeferredRegistrations" call.
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
            throw new Error("Module 2 registration failed");
        });

    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    const errors = await registry.updateDeferredRegistrations({}, runtime);

    expect(errors.length).toBe(1);
    expect(errors[0]!.cause!.toString()).toContain("Module 2 registration failed");
});

test.concurrent("when a deferred registration fail, RemoteModuleDeferredRegistrationUpdateFailedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModuleDeferredRegistrationUpdateFailedEvent, listener);

    const registrationError = new Error("Module 2 registration failed");

    const register1 = vi.fn();

    const register2 = vi.fn()
        // Do not wait on the "registerDeferredRegistrations" call but wait on the "updateDeferredRegistrations" call.
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
            throw registrationError;
        });

    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });


    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);
    await registry.updateDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.any(RemoteModuleRegistrationError));
});

test.concurrent("when a deferred registration fail, RemoteModulesDeferredRegistrationsUpdateCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationsUpdateCompletedEvent, listener);

    const registrationError = new Error("Module 2 registration failed");

    const register1 = vi.fn();

    const register2 = vi.fn()
        // Do not wait on the "registerDeferredRegistrations" call but wait on the "updateDeferredRegistrations" call.
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
            throw registrationError;
        });

    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });


    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);
    await registry.updateDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        registrationCount: 2
    }));
});

test.concurrent("all the deferred module registrations receive the data object", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const register1 = vi.fn();
    const register2 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });


    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    register1.mockReset();
    register2.mockReset();
    register3.mockReset();

    const data = {
        foo: "bar"
    };

    await registry.updateDeferredRegistrations(data, runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalledWith(runtime, data, "update");
    expect(register2).toHaveBeenCalledWith(runtime, data, "update");
    expect(register3).toHaveBeenCalledWith(runtime, data, "update");
});

test.concurrent("all the deferred module registrations receive \"update\" as state", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const register1 = vi.fn();
    const register2 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => register2
        })
        .mockResolvedValueOnce({
            register: () => register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    register1.mockReset();
    register2.mockReset();
    register3.mockReset();

    const data = {
        foo: "bar"
    };

    await registry.updateDeferredRegistrations(data, runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalledWith(runtime, data, "update");
    expect(register2).toHaveBeenCalledWith(runtime, data, "update");
    expect(register3).toHaveBeenCalledWith(runtime, data, "update");
});
