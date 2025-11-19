import { Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import {
    RemoteModuleDeferredRegistrationFailedEvent,
    RemoteModuleDeferredRegistrationUpdateFailedEvent,
    RemoteModuleRegistrationError,
    RemoteModuleRegistrationFailedEvent,
    RemoteModuleRegistry,
    RemoteModulesDeferredRegistrationCompletedEvent,
    RemoteModulesDeferredRegistrationStartedEvent,
    RemoteModulesDeferredRegistrationsUpdateCompletedEvent,
    RemoteModulesDeferredRegistrationsUpdateStartedEvent,
    RemoteModulesRegistrationCompletedEvent,
    RemoteModulesRegistrationStartedEvent
} from "../src/RemoteModuleRegistry.ts";
import { sleep } from "./utils.ts";

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

describe.concurrent("registerModules", () => {
    test.concurrent("should register all the modules", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const loadRemote = vi.fn().mockResolvedValue({
            register: () => {}
        });

        const registry = new RemoteModuleRegistry(loadRemote);

        await registry.registerModules([{ name: "Dummy-1" }], runtime);

        await expect(async () => registry.registerModules([{ name: "Dummy-1" }], runtime)).rejects.toThrow(/The registerRemoteModules function can only be called once/);
    });

    test.concurrent("should dispatch RemoteModulesRegistrationStartedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        expect(errors[0].cause!.toString()).toContain("Module 2 registration failed");
    });

    test.concurrent("when a module registration fail, RemoteModuleRegistrationFailedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        expect(listener).toHaveBeenCalledWith(expect.any(RemoteModuleRegistrationError));
    });

    test.concurrent("when a module registration fail, RemoteModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

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
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new RemoteModuleRegistry(vi.fn());

        await registry.registerModules([], runtime);

        expect(registry.registrationStatus).toBe("ready");
    });

    test.concurrent("when no modules are provided, do not dispatch RemoteModulesRegistrationStartedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, listener);

        const registry = new RemoteModuleRegistry(vi.fn());

        await registry.registerModules([], runtime);

        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("when no modules are provided, do not dispatch RemoteModulesRegistrationCompletedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, listener);

        const registry = new RemoteModuleRegistry(vi.fn());

        await registry.registerModules([], runtime);

        expect(listener).not.toHaveBeenCalled();
    });
});

describe.concurrent("registerDeferredRegistrations", () => {
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
                    await sleep(10);

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
});

describe.concurrent("updateDeferredRegistrations", () => {
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
                await sleep(10);

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
        expect(errors[0].cause!.toString()).toContain("Module 2 registration failed");
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
});
