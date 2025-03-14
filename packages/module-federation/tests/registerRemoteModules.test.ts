import { Runtime } from "@squide/core";
import { test, vi } from "vitest";
import { RemoteModuleRegistrationFailedEvent, RemoteModuleRegistry, RemoteModulesRegistrationCompletedEvent, RemoteModulesRegistrationStartedEvent } from "../src/registerRemoteModules.ts";

class DummyRuntime extends Runtime<unknown, unknown> {
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
}

test.concurrent("should register all the modules", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const register1 = vi.fn();
    const register2 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: register1
        })
        .mockResolvedValueOnce({
            register: register2
        })
        .mockResolvedValueOnce({
            register: register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalled();
    expect(register2).toHaveBeenCalled();
    expect(register3).toHaveBeenCalled();
});

test.concurrent("when called twice, throw an error", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([{ name: "Dummy-1" }], runtime);

    await expect(async () => registry.registerModules([{ name: "Dummy-1" }], runtime)).rejects.toThrow(/The registerRemoteModules function can only be called once/);
});

test.concurrent("should dispatch RemoteModulesRegistrationStartedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([{ name: "Dummy-1" }], runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        remoteCount: 1
    }));
});

test.concurrent("when there are no deferred registrations, once all the modules are registered, set the status to \"ready\"", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    expect(registry.registrationStatus).toBe("ready");
});

test.concurrent("when there are no deferred registrations, once all the modules are registered, RemoteModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        remoteCount: 2
    }));
});

test.concurrent("when there are deferred registrations, once all the modules are registered, set the status to \"modules-registered\"", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    expect(registry.registrationStatus).toBe("modules-registered");
});

test.concurrent("when there are deferred registrations, once all the modules are registered, RemoteModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, listener);

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        remoteCount: 2
    }));
});

test.concurrent("when a module registration fail, register the remaining modules", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const register1 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: register1
        })
        .mockResolvedValueOnce({
            register: () => { throw new Error("Module 2 registration failed"); }
        })
        .mockResolvedValueOnce({
            register: register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalled();
    expect(register3).toHaveBeenCalled();
});

test.concurrent("when a module registration fail, return the error", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => {}
        })
        .mockResolvedValueOnce({
            register: () => { throw new Error("Module 2 registration failed"); }
        })
        .mockResolvedValueOnce({
            register: () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    const errors = await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(errors.length).toBe(1);
    expect(errors[0]!.error!.toString()).toContain("Module 2 registration failed");
});

test.concurrent("when a module registration fail, RemoteModuleRegistrationFailedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModuleRegistrationFailedEvent, listener);

    const registrationError = new Error("Module 2 registration failed");

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => {}
        })
        .mockResolvedValueOnce({
            register: () => { throw registrationError; }
        })
        .mockResolvedValueOnce({
            register: () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        error: registrationError
    }));
});

test.concurrent("when a module registration fail, RemoteModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, listener);

    const registrationError = new Error("Module 2 registration failed");

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: () => {}
        })
        .mockResolvedValueOnce({
            register: () => { throw registrationError; }
        })
        .mockResolvedValueOnce({
            register: () => {}
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        remoteCount: 2
    }));
});

test.concurrent("when a context is provided, all the register functions receive the provided context", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const register1 = vi.fn();
    const register2 = vi.fn();
    const register3 = vi.fn();

    const loadRemote = vi.fn()
        .mockResolvedValueOnce({
            register: register1
        })
        .mockResolvedValueOnce({
            register: register2
        })
        .mockResolvedValueOnce({
            register: register3
        });

    const registry = new RemoteModuleRegistry(loadRemote);

    const context = {
        foo: "bar"
    };

    await registry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime, { context });

    expect(register1).toHaveBeenCalledTimes(1);
    expect(register2).toHaveBeenCalledTimes(1);
    expect(register3).toHaveBeenCalledTimes(1);
    expect(register1).toHaveBeenCalledWith(runtime, context);
    expect(register2).toHaveBeenCalledWith(runtime, context);
    expect(register3).toHaveBeenCalledWith(runtime, context);
});

test.concurrent("when no modules are provided, the status is \"ready\"", async ({ expect }) => {
    const runtime = new DummyRuntime();
    const registry = new RemoteModuleRegistry(vi.fn());

    await registry.registerModules([], runtime);

    expect(registry.registrationStatus).toBe("ready");
});

test.concurrent("when no modules are provided, do not dispatch RemoteModulesRegistrationStartedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, listener);

    const registry = new RemoteModuleRegistry(vi.fn());

    await registry.registerModules([], runtime);

    expect(listener).not.toHaveBeenCalled();
});

test.concurrent("when no modules are provided, do not dispatch RemoteModulesRegistrationCompletedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, listener);

    const registry = new RemoteModuleRegistry(vi.fn());

    await registry.registerModules([], runtime);

    expect(listener).not.toHaveBeenCalled();
});
