import { test, vi } from "vitest";
import { LocalModuleRegistrationFailedEvent, LocalModuleRegistry, LocalModulesRegistrationCompletedEvent, LocalModulesRegistrationStartedEvent } from "../src/registration/registerLocalModules.ts";
import { Runtime } from "../src/runtime/runtime.ts";

function simulateDelay(delay: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, delay);
    });
}

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
    const runtime = new DummyRuntime();
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
    const runtime = new DummyRuntime();
    const registry = new LocalModuleRegistry();

    await registry.registerModules([() => {}], runtime);

    await expect(async () => registry.registerModules([() => {}], runtime)).rejects.toThrow(/The registerLocalModules function can only be called once/);
});

test.concurrent("should dispatch LocalModulesRegistrationStartedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime();

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
    const runtime = new DummyRuntime();
    const registry = new LocalModuleRegistry();

    await registry.registerModules([
        () => {},
        () => {}
    ], runtime);

    expect(registry.registrationStatus).toBe("ready");
});

test.concurrent("when there are no deferred registrations, once all the modules are registered, LocalModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

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
    const runtime = new DummyRuntime();
    const registry = new LocalModuleRegistry();

    await registry.registerModules([
        () => {},
        () => () => {}
    ], runtime);

    expect(registry.registrationStatus).toBe("modules-registered");
});

test.concurrent("when there are deferred registrations, once all the modules are registered, LocalModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

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
    const runtime = new DummyRuntime();
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
    const runtime = new DummyRuntime();
    const registry = new LocalModuleRegistry();

    const errors = await registry.registerModules([
        () => {},
        () => { throw new Error("Module 2 registration failed"); },
        () => {}
    ], runtime);

    expect(errors.length).toBe(1);
    expect(errors[0]!.error!.toString()).toContain("Module 2 registration failed");
});

test.concurrent("when a module registration fail, LocalModuleRegistrationFailedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

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
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        error: registrationError
    }));
});

test.concurrent("when a module registration fail, LocalModulesRegistrationCompletedEvent is dispatched", async ({ expect }) => {
    const runtime = new DummyRuntime();

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
    const runtime = new DummyRuntime();

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
    const runtime = new DummyRuntime();
    const registry = new LocalModuleRegistry();

    await registry.registerModules([], runtime);

    expect(registry.registrationStatus).toBe("ready");
});

test.concurrent("when no modules are provided, do not dispatch LocalModulesRegistrationStartedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, listener);

    const registry = new LocalModuleRegistry();

    await registry.registerModules([], runtime);

    expect(listener).not.toHaveBeenCalled();
});

test.concurrent("when no modules are provided, do not dispatch LocalModulesRegistrationCompletedEvent", async ({ expect }) => {
    const runtime = new DummyRuntime();

    const listener = vi.fn();

    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, listener);

    const registry = new LocalModuleRegistry();

    await registry.registerModules([], runtime);

    expect(listener).not.toHaveBeenCalled();
});


