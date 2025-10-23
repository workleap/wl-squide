import { Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { RemoteModuleDeferredRegistrationFailedEvent, RemoteModuleRegistrationError, RemoteModuleRegistry, RemoteModulesDeferredRegistrationCompletedEvent, RemoteModulesDeferredRegistrationStartedEvent } from "../src/registerRemoteModules.ts";

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

test.concurrent("when called before registerRemoteModules, throw an error", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const registry = new RemoteModuleRegistry(vi.fn());

    await expect(() => registry.registerDeferredRegistrations({}, runtime)).rejects.toThrow(/The registerDeferredRegistrations function can only be called once the remote modules are registered/);
});

test.concurrent("when called twice, throw an error", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    await expect(() => registry.registerDeferredRegistrations({}, runtime)).rejects.toThrow(/The registerDeferredRegistrations function can only be called once/);
});

test.concurrent("when called for the first time but the registration status is already \"ready\", return a resolving promise", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    // When there's no deferred modules, the status should be "ready".
    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    expect(registry.registrationStatus).toBe("ready");

    await registry.registerDeferredRegistrations({}, runtime);

    expect(registry.registrationStatus).toBe("ready");
});

test.concurrent("should dispatch RemoteModulesDeferredRegistrationStartedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        registrationCount: 2
    }));
});

test.concurrent("should complete all the deferred registrations", async ({ expect }) => {
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

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalled();
    expect(register2).toHaveBeenCalled();
    expect(register3).toHaveBeenCalled();
});

test.concurrent("when all the deferred registrations are completed, set the status to \"ready\"", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(registry.registrationStatus).toBe("modules-registered");

    await registry.registerDeferredRegistrations({}, runtime);

    expect(registry.registrationStatus).toBe("ready");
});

test.concurrent("when all the deferred registrations are completed, RemoteModulesDeferredRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        registrationCount: 3
    }));
});

test.concurrent("when a deferred registration is asynchronous, the function can be awaited", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    let hasBeenCompleted = false;

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => () => {}
        })
        .mockResolvedValueOnce({
            register: () => async () => {
                await simulateDelay(10);

                hasBeenCompleted = true;
            }
        })
        .mockResolvedValueOnce({
            register: () => () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    expect(hasBeenCompleted).toBeTruthy();
});

test.concurrent("when a deferred registration fail, complete the remaining deferred registrations", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const register1 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => register1
        })
        .mockResolvedValueOnce({
            register: () => () => { throw new Error("Module 2 registration failed"); }
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

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalled();
    expect(register3).toHaveBeenCalled();
});

test.concurrent("when a deferred registration fail, return the error", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => () => {}
        })
        .mockResolvedValueOnce({
            register: () => () => { throw new Error("Module 2 deferred registration failed"); }
        })
        .mockResolvedValueOnce({
            register: () => () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    const errors = await registry.registerDeferredRegistrations({}, runtime);

    expect(errors.length).toBe(1);
    expect(errors[0].cause!.toString()).toContain("Module 2 deferred registration failed");
});

test.concurrent("when a deferred registration fail, RemoteModuleDeferredRegistrationFailedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModuleDeferredRegistrationFailedEvent, listener);

    const registrationError = new Error("Module 2 deferred registration failed");

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => () => {}
        })
        .mockResolvedValueOnce({
            register: () => () => { throw registrationError; }
        })
        .mockResolvedValueOnce({
            register: () => () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.any(RemoteModuleRegistrationError));
});

test.concurrent("when a deferred registration fail, RemoteModulesDeferredRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, listener);

    const registrationError = new Error("Module 2 deferred registration failed");

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => () => {}
        })
        .mockResolvedValueOnce({
            register: () => () => { throw registrationError; }
        })
        .mockResolvedValueOnce({
            register: () => () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await registry.registerDeferredRegistrations({}, runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        registrationCount: 2
    }));
});

test.concurrent("all the deferred registrations receive the data object", async ({ expect }) => {
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

    const data = {
        foo: "bar"
    };

    await registry.registerDeferredRegistrations(data, runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalledWith(runtime, data, "register");
    expect(register2).toHaveBeenCalledWith(runtime, data, "register");
    expect(register3).toHaveBeenCalledWith(runtime, data, "register");
});

test.concurrent("all the deferred registrations receive \"register\" as state", async ({ expect }) => {
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

    const data = {
        foo: "bar"
    };

    await registry.registerDeferredRegistrations(data, runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalledWith(runtime, data, "register");
    expect(register2).toHaveBeenCalledWith(runtime, data, "register");
    expect(register3).toHaveBeenCalledWith(runtime, data, "register");
});

