import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import { LocalModuleDeferredRegistrationFailedEvent, LocalModuleDeferredRegistrationUpdateFailedEvent, LocalModuleRegistrationFailedEvent, LocalModuleRegistry, LocalModulesDeferredRegistrationCompletedEvent, LocalModulesDeferredRegistrationStartedEvent, LocalModulesDeferredRegistrationsUpdateCompletedEvent, LocalModulesDeferredRegistrationsUpdateStartedEvent, LocalModulesRegistrationCompletedEvent, LocalModulesRegistrationStartedEvent } from "../src/registration/LocalModuleRegistry.ts";
import { ModuleRegistrationError } from "../src/registration/moduleRegistry2.ts";
import { Runtime } from "../src/runtime/runtime2.ts";

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

describe.concurrent("registerModules", () => {
    test.concurrent("should register all the modules", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            register1,
            register2,
            register3
        ], runtime);

        expect(register1).toHaveBeenCalled();
        expect(register2).toHaveBeenCalled();
        expect(register3).toHaveBeenCalled();
    });

    test.concurrent("when a module is asynchronous, the function can be awaited", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        let hasBeenCompleted = false;

        await registry.registerModules([
            () => {},
            async () => {
                await simulateDelay(10);

                hasBeenCompleted = true;
            },
            () => {}
        ], runtime);

        expect(hasBeenCompleted).toBeTruthy();
    });

    test.concurrent("when called twice, throw an error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([() => {}], runtime);

        await expect(async () => registry.registerModules([() => {}], runtime)).rejects.toThrow(/The registerLocalModules function can only be called once/);
    });

    test.concurrent("should dispatch LocalModulesRegistrationStartedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => {},
            () => {}
        ], runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            moduleCount: 2
        }));
    });

    test.concurrent("when there are no deferred registrations, once all the modules are registered, set the status to \"ready\"", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => {},
            () => {}
        ], runtime);

        expect(registry.registrationStatus).toBe("ready");
    });

    test.concurrent("when there are no deferred registrations, once all the modules are registered, LocalModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => {},
            () => {}
        ], runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            moduleCount: 2
        }));
    });

    test.concurrent("when there are deferred registrations, once all the modules are registered, set the status to \"modules-registered\"", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => {},
            () => () => {}
        ], runtime);

        expect(registry.registrationStatus).toBe("modules-registered");
    });

    test.concurrent("when there are deferred registrations, once all the modules are registered, LocalModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => {},
            () => () => {}
        ], runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            moduleCount: 2
        }));
    });

    test.concurrent("when a module registration fail, register the remaining modules", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            register1,
            () => { throw new Error("Module 2 registration failed"); },
            register3
        ], runtime);

        expect(register1).toHaveBeenCalled();
        expect(register3).toHaveBeenCalled();
    });

    test.concurrent("when a module registration fail, return the error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const errors = await registry.registerModules([
            () => {},
            () => { throw new Error("Module 2 registration failed"); },
            () => {}
        ], runtime);

        expect(errors.length).toBe(1);
        expect(errors[0].cause!.toString()).toContain("Module 2 registration failed");
    });

    test.concurrent("when a module registration fail, LocalModuleRegistrationFailedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModuleRegistrationFailedEvent, listener);

        const registry = new LocalModuleRegistry();
        const registrationError = new Error("Module 2 registration failed");

        await registry.registerModules([
            () => {},
            () => { throw registrationError; },
            () => {}
        ], runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.any(ModuleRegistrationError));
    });

    test.concurrent("when a module registration fail, LocalModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, listener);

        const registry = new LocalModuleRegistry();
        const registrationError = new Error("Module 2 registration failed");

        await registry.registerModules([
            () => {},
            () => { throw registrationError; },
            () => {}
        ], runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            moduleCount: 2
        }));
    });

    test.concurrent("when a context is provided, all the register functions receive the provided context", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        const registry = new LocalModuleRegistry();

        const context = {
            foo: "bar"
        };

        await registry.registerModules([
            register1,
            register2,
            register3
        ], runtime, { context });

        expect(register1).toHaveBeenCalledWith(runtime, context);
        expect(register2).toHaveBeenCalledWith(runtime, context);
        expect(register3).toHaveBeenCalledWith(runtime, context);
    });

    test.concurrent("when no modules are provided, the status is \"ready\"", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([], runtime);

        expect(registry.registrationStatus).toBe("ready");
    });

    test.concurrent("when no modules are provided, do not dispatch LocalModulesRegistrationStartedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([], runtime);

        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("when no modules are provided, do not dispatch LocalModulesRegistrationCompletedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([], runtime);

        expect(listener).not.toHaveBeenCalled();
    });
});

describe.concurrent("registerDeferredRegistrations", () => {
    test.concurrent("when called before registerLocalModules, throw an error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await expect(() => registry.registerDeferredRegistrations({}, runtime)).rejects.toThrow(/The registerDeferredRegistrations function can only be called once the local modules are registered/);
    });

    test.concurrent("when called twice, throw an error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        await expect(() => registry.registerDeferredRegistrations({}, runtime)).rejects.toThrow(/The registerDeferredRegistrations function can only be called once/);
    }, 50000);

    test.concurrent("when called for the first time but the registration status is already \"ready\", return a resolving promise", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        // When there's no deferred modules, the status should be "ready".
        await registry.registerModules([
            () => {},
            () => {}
        ], runtime);

        expect(registry.registrationStatus).toBe("ready");

        await registry.registerDeferredRegistrations({}, runtime);

        expect(registry.registrationStatus).toBe("ready");
    });

    test.concurrent("should dispatch LocalModulesDeferredRegistrationStartedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            registrationCount: 2
        }));
    });

    test.concurrent("should register all the deferred registrations", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => register2,
            () => register3
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(register1).toHaveBeenCalled();
        expect(register2).toHaveBeenCalled();
        expect(register3).toHaveBeenCalled();
    });

    test.concurrent("when all the deferred registrations are registered, set the status to \"ready\"", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {}
        ], runtime);

        expect(registry.registrationStatus).toBe("modules-registered");

        await registry.registerDeferredRegistrations({}, runtime);

        expect(registry.registrationStatus).toBe("ready");
    });

    test.concurrent("when all the deferred registrations are registered, LocalModulesDeferredRegistrationCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            registrationCount: 2
        }));
    });

    test.concurrent("when a deferred registration is asynchronous, the function can be awaited", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        let hasBeenCompleted = false;

        await registry.registerModules([
            () => () => {},
            () => async () => {
                await simulateDelay(10);

                hasBeenCompleted = true;
            },
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(hasBeenCompleted).toBeTruthy();
    });

    test.concurrent("when a deferred registration fail, register the remaining deferred registrations", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => () => { throw new Error("Module 2 registration failed"); },
            () => register3
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(register1).toHaveBeenCalled();
        expect(register3).toHaveBeenCalled();
    });

    test.concurrent("when a deferred registration fail, return the error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => { throw new Error("Module 2 deferred registration failed"); },
            () => () => {}
        ], runtime);

        const errors = await registry.registerDeferredRegistrations({}, runtime);

        expect(errors.length).toBe(1);
        expect(errors[0].cause!.toString()).toContain("Module 2 deferred registration failed");
    });

    test.concurrent("when a deferred registration fail, LocalModuleDeferredRegistrationFailedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModuleDeferredRegistrationFailedEvent, listener);

        const registry = new LocalModuleRegistry();
        const registrationError = new Error("Module 2 registration failed");

        await registry.registerModules([
            () => () => {},
            () => () => { throw registrationError; },
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.any(ModuleRegistrationError));
    });

    test.concurrent("when a deferred registration fail, LocalModulesDeferredRegistrationCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, listener);

        const registry = new LocalModuleRegistry();
        const registrationError = new Error("Module 2 registration failed");

        await registry.registerModules([
            () => () => {},
            () => () => { throw registrationError; },
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            registrationCount: 2
        }));
    });

    test.concurrent("all the deferred module registrations receive the data object", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => register2,
            () => register3
        ], runtime);

        const data = {
            foo: "bar"
        };

        await registry.registerDeferredRegistrations(data, runtime);

        expect(register1).toHaveBeenCalledWith(runtime, data, "register");
        expect(register2).toHaveBeenCalledWith(runtime, data, "register");
        expect(register3).toHaveBeenCalledWith(runtime, data, "register");
    });

    test.concurrent("all the deferred module registrations receive \"register\" as state", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => register2,
            () => register3
        ], runtime);

        const data = {
            foo: "bar"
        };

        await registry.registerDeferredRegistrations(data, runtime);

        expect(register1).toHaveBeenCalledWith(runtime, data, "register");
        expect(register2).toHaveBeenCalledWith(runtime, data, "register");
        expect(register3).toHaveBeenCalledWith(runtime, data, "register");
    });
});

describe.concurrent("updateDeferredRegistrations", () => {
    test.concurrent("when called before registerLocalModules, throw an error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await expect(() => registry.updateDeferredRegistrations({}, runtime)).rejects.toThrow(/The updateDeferredRegistrations function can only be called once the local modules are ready/);
    });

    test.concurrent("when called before registerLocalModuleDeferredRegistrations, throw an error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {},
            () => () => {}
        ], runtime);

        await expect(() => registry.updateDeferredRegistrations({}, runtime)).rejects.toThrow(/The updateDeferredRegistrations function can only be called once the local modules are ready/);
    });

    test.concurrent("should dispatch LocalModulesDeferredRegistrationsUpdateStartedEvent", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesDeferredRegistrationsUpdateStartedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {},
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);
        await registry.updateDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            registrationCount: 3
        }));
    });

    test.concurrent("should update all the deferred registrations", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => register2,
            () => register3
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        register1.mockReset();
        register2.mockReset();
        register3.mockReset();

        await registry.updateDeferredRegistrations({}, runtime);

        expect(register1).toHaveBeenCalledTimes(1);
        expect(register2).toHaveBeenCalledTimes(1);
        expect(register3).toHaveBeenCalledTimes(1);
    });

    test.concurrent("when all deferred registrations has been updated, LocalModulesDeferredRegistrationsUpdateCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesDeferredRegistrationsUpdateCompletedEvent, listener);

        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            () => () => {},
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);
        await registry.updateDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            registrationCount: 3
        }));
    });

    test.concurrent("when a deferred registration is asynchronous, the function can be awaited", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        let hasBeenCompleted = false;

        await registry.registerModules([
            () => () => {},
            // Do not wait on the "registerDeferredRegistrations" call but wait on the "updateDeferredRegistrations" call.
            () => vi.fn()
                .mockImplementationOnce(() => {})
                .mockImplementationOnce(async () => {
                    await simulateDelay(10);

                    hasBeenCompleted = true;
                }),
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        await registry.updateDeferredRegistrations({}, runtime);

        expect(hasBeenCompleted).toBeTruthy();
    });

    test.concurrent("when a deferred registration fail, update the remaining deferred registrations", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            // Do not throw on the "registerDeferredRegistrations" call but throw on the "updateDeferredRegistrations" call.
            () => vi.fn()
                .mockImplementationOnce(() => {})
                .mockImplementationOnce(() => {
                    throw new Error("Module 2 registration failed");
                }),
            () => register3
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        register1.mockReset();
        register3.mockReset();

        await registry.updateDeferredRegistrations({}, runtime);

        expect(register1).toHaveBeenCalledTimes(1);
        expect(register3).toHaveBeenCalledTimes(1);
    });

    test.concurrent("when a deferred registration fail, return the error", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
        const registry = new LocalModuleRegistry();

        await registry.registerModules([
            () => () => {},
            // Do not throw on the "registerDeferredRegistrations" call but throw on the "updateDeferredRegistrations" call.
            () => vi.fn()
                .mockImplementationOnce(() => {})
                .mockImplementationOnce(() => {
                    throw new Error("Module 2 registration failed");
                }),
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);

        const errors = await registry.updateDeferredRegistrations({}, runtime);

        expect(errors.length).toBe(1);
        expect(errors[0].cause!.toString()).toContain("Module 2 registration failed");
    });

    test.concurrent("when a deferred registration fail, LocalModuleDeferredRegistrationUpdateFailedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModuleDeferredRegistrationUpdateFailedEvent, listener);

        const registry = new LocalModuleRegistry();
        const registrationError = new Error("Module 2 registration failed");

        await registry.registerModules([
            () => () => {},
            // Do not throw on the "registerDeferredRegistrations" call but throw on the "updateDeferredRegistrations" call.
            () => vi.fn()
                .mockImplementationOnce(() => {})
                .mockImplementationOnce(() => {
                    throw registrationError;
                }),
            () => () => {}
        ], runtime);

        await registry.registerDeferredRegistrations({}, runtime);
        await registry.updateDeferredRegistrations({}, runtime);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.any(ModuleRegistrationError));
    });

    test.concurrent("when a deferred registration fail, LocalModulesDeferredRegistrationsUpdateCompletedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });

        const listener = vi.fn();

        runtime.eventBus.addListener(LocalModulesDeferredRegistrationsUpdateCompletedEvent, listener);

        const registry = new LocalModuleRegistry();
        const registrationError = new Error("Module 2 registration failed");

        await registry.registerModules([
            () => () => {},
            // Do not throw on the "registerDeferredRegistrations" call but throw on the "updateDeferredRegistrations" call.
            () => vi.fn()
                .mockImplementationOnce(() => {})
                .mockImplementationOnce(() => {
                    throw registrationError;
                }),
            () => () => {}
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
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => register2,
            () => register3
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
        const registry = new LocalModuleRegistry();

        const register1 = vi.fn();
        const register2 = vi.fn();
        const register3 = vi.fn();

        await registry.registerModules([
            () => register1,
            () => register2,
            () => register3
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
