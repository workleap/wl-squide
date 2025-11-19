import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import { ModuleManager } from "../src/registration/ModuleManager.ts";
import { ModuleRegistrationError, ModuleRegistrationStatus, ModuleRegistrationStatusChangedListener, ModuleRegistry } from "../src/registration/moduleRegistry.ts";
import { Runtime } from "../src/runtime/runtime.ts";

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
    }

    completeDeferredRegistrationScope(): void {
    }

    get logger() {
        return new NoopLogger();
    }

    startScope(): Runtime {
        return new DummyRuntime({ loggers: [new NoopLogger()] });
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

describe.concurrent("registerModules", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        readonly #id: string;

        constructor(id: string) {
            super();

            this.#id = id;
        }

        get id(): string {
            return this.#id;
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            return Promise.resolve([]);
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        removeStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        get registrationStatus(): ModuleRegistrationStatus {
            throw new Error("Method not implemented.");
        }
    }

    test.concurrent("can register the modules of every registry", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("registry-1");
        const moduleRegistry2 = new DummyModuleRegistry("registry-2");
        const moduleRegistry3 = new DummyModuleRegistry("registry-3");

        const spy1 = vi.spyOn(moduleRegistry1, "registerModules");
        const spy2 = vi.spyOn(moduleRegistry2, "registerModules");
        const spy3 = vi.spyOn(moduleRegistry3, "registerModules");

        const runtime = new DummyRuntime();

        const manager = new ModuleManager(runtime, [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        const fct1 = () => {};
        const fct2 = () => {};
        const fct3 = () => {};
        const fct4 = () => {};

        const definition1 = { registryId: "registry-1", definition: fct1 };
        const definition2 = { registryId: "registry-2", definition: fct2 };
        const definition3 = { registryId: "registry-2", definition: fct3 };
        const definition4 = { registryId: "registry-3", definition: fct4 };

        await manager.registerModules([
            definition1,
            definition2,
            definition3,
            definition4
        ]);

        expect(spy1).toHaveBeenCalledExactlyOnceWith([fct1], runtime, undefined);
        expect(spy2).toHaveBeenCalledExactlyOnceWith([fct2, fct3], runtime, undefined);
        expect(spy3).toHaveBeenCalledExactlyOnceWith([fct4], runtime, undefined);
    });

    test.concurrent("when an unmanaged errors is thrown, the error bubbles up", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("registry-1");
        const moduleRegistry2 = new DummyModuleRegistry("registry-2");
        const moduleRegistry3 = new DummyModuleRegistry("registry-3");

        vi.spyOn(moduleRegistry2, "registerModules").mockImplementationOnce(() => {
            throw new Error("Can me if you can!");
        });

        const runtime = new DummyRuntime();

        const manager = new ModuleManager(runtime, [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        const definition1 = { registryId: "registry-1", definition: () => {} };
        const definition2 = { registryId: "registry-2", definition: () => {} };
        const definition3 = { registryId: "registry-3", definition: () => {} };

        await expect(() => manager.registerModules([
            definition1,
            definition2,
            definition3
        ])).rejects.toThrow("Can me if you can!");
    });

    test.concurrent("when a module is registered for a registry that has not been added, an error is thrown", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("registry-1");
        const moduleRegistry2 = new DummyModuleRegistry("registry-2");
        const moduleRegistry3 = new DummyModuleRegistry("registry-3");

        const runtime = new DummyRuntime();

        const manager = new ModuleManager(runtime, [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        const definition1 = { registryId: "registry-1", definition: () => {} };
        const definition2 = { registryId: "registry-2", definition: () => {} };
        const definition3 = { registryId: "registry-345", definition: () => {} };

        await expect(() => manager.registerModules([
            definition1,
            definition2,
            definition3
        ])).rejects.toThrow("Cannot find a module registry with id \"registry-345\"");
    });

    test.concurrent("managed errors returned by the registries are aggregated", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("registry-1");
        const moduleRegistry2 = new DummyModuleRegistry("registry-2");
        const moduleRegistry3 = new DummyModuleRegistry("registry-3");

        const error1 = new ModuleRegistrationError("Error 1");
        const error2 = new ModuleRegistrationError("Error 2");
        const error3 = new ModuleRegistrationError("Error 3");

        vi.spyOn(moduleRegistry1, "registerModules").mockImplementationOnce(() => Promise.resolve([error1]));
        vi.spyOn(moduleRegistry2, "registerModules").mockImplementationOnce(() => Promise.resolve([error2]));
        vi.spyOn(moduleRegistry3, "registerModules").mockImplementationOnce(() => Promise.resolve([error3]));

        const runtime = new DummyRuntime();

        const manager = new ModuleManager(runtime, [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        const definition1 = { registryId: "registry-1", definition: () => {} };
        const definition2 = { registryId: "registry-2", definition: () => {} };
        const definition3 = { registryId: "registry-3", definition: () => {} };

        const errors = await manager.registerModules([
            definition1,
            definition2,
            definition3
        ]);

        expect(errors.length).toBe(3);
        expect(errors[0]).toBe(error1);
        expect(errors[1]).toBe(error2);
        expect(errors[2]).toBe(error3);
    });
});

describe.concurrent("registerDeferredRegistrations", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        get id(): string {
            throw new Error("Method not implemented.");
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            return Promise.resolve([]);
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        removeStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        get registrationStatus(): ModuleRegistrationStatus {
            throw new Error("Method not implemented.");
        }
    }

    test.concurrent("register the deferred registrations for the modules of all the registries", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        const spy1 = vi.spyOn(moduleRegistry1, "registerDeferredRegistrations");
        const spy2 = vi.spyOn(moduleRegistry2, "registerDeferredRegistrations");
        const spy3 = vi.spyOn(moduleRegistry3, "registerDeferredRegistrations");

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const data = {
            foo: "bar"
        };

        await runtime.moduleManager.registerDeferredRegistrations(data);

        expect(spy1).toHaveBeenCalledExactlyOnceWith(data, runtime);
        expect(spy2).toHaveBeenCalledExactlyOnceWith(data, runtime);
        expect(spy3).toHaveBeenCalledExactlyOnceWith(data, runtime);
    });

    test.concurrent("can start and complete a deferred registration scope", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const startScopeSpy = vi.spyOn(runtime, "startDeferredRegistrationScope");
        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        const data = {
            foo: "bar"
        };

        await runtime.moduleManager.registerDeferredRegistrations(data);

        expect(startScopeSpy).toHaveBeenCalledTimes(1);
        expect(completeScopeSpy).toHaveBeenCalledTimes(1);
    });

    test("when an unmanaged error is thrown, complete the deferred registration scope", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        vi.spyOn(moduleRegistry2, "registerDeferredRegistrations").mockImplementation(() => {
            throw new Error("Something went wrong!");
        });

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        const data = {
            foo: "bar"
        };

        await expect(() => runtime.moduleManager.registerDeferredRegistrations(data)).rejects.toThrow();

        expect(completeScopeSpy).toHaveBeenCalledTimes(1);
    });

    test.concurrent("errors returned by the registries are aggragated", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        const error1 = new ModuleRegistrationError("Error 1");
        const error2 = new ModuleRegistrationError("Error 2");
        const error3 = new ModuleRegistrationError("Error 3");

        vi.spyOn(moduleRegistry1, "registerDeferredRegistrations").mockReturnValueOnce(Promise.resolve([error1]));
        vi.spyOn(moduleRegistry2, "registerDeferredRegistrations").mockReturnValueOnce(Promise.resolve([error2]));
        vi.spyOn(moduleRegistry3, "registerDeferredRegistrations").mockReturnValueOnce(Promise.resolve([error3]));

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const data = {
            foo: "bar"
        };

        const errors = await runtime.moduleManager.registerDeferredRegistrations(data);

        expect(errors.length).toBe(3);
        expect(errors[0]).toBe(error1);
        expect(errors[1]).toBe(error2);
        expect(errors[2]).toBe(error3);
    });
});

describe.concurrent("updateDeferredRegistrations", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        get id(): string {
            throw new Error("Method not implemented.");
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            return Promise.resolve([]);
        }

        registerStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        removeStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        get registrationStatus(): ModuleRegistrationStatus {
            throw new Error("Method not implemented.");
        }
    }

    test.concurrent("update the deferred registrations for the modules of all the registries", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        const spy1 = vi.spyOn(moduleRegistry1, "updateDeferredRegistrations");
        const spy2 = vi.spyOn(moduleRegistry2, "updateDeferredRegistrations");
        const spy3 = vi.spyOn(moduleRegistry3, "updateDeferredRegistrations");

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const data = {
            foo: "bar"
        };

        await runtime.moduleManager.updateDeferredRegistrations(data);

        expect(spy1).toHaveBeenCalledWith(data, runtime);
        expect(spy2).toHaveBeenCalledWith(data, runtime);
        expect(spy3).toHaveBeenCalledWith(data, runtime);
    });

    test.concurrent("can start and complete a deferred registration scope", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const startScopeSpy = vi.spyOn(runtime, "startDeferredRegistrationScope");
        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        const data = {
            foo: "bar"
        };

        await runtime.moduleManager.updateDeferredRegistrations(data);

        expect(startScopeSpy).toHaveBeenCalledTimes(1);
        expect(completeScopeSpy).toHaveBeenCalledTimes(1);
    });

    test.concurrent("when an unmanaged error is thrown, complete the deferred registration scope", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        vi.spyOn(moduleRegistry2, "updateDeferredRegistrations").mockImplementation(() => {
            throw new Error("Something went wrong!");
        });

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        const data = {
            foo: "bar"
        };

        await expect(() => runtime.moduleManager.updateDeferredRegistrations(data)).rejects.toThrow();

        expect(completeScopeSpy).toHaveBeenCalledTimes(1);
    });

    test.concurrent("managed errors returned by the registries are aggregated", async ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry();
        const moduleRegistry2 = new DummyModuleRegistry();
        const moduleRegistry3 = new DummyModuleRegistry();

        const error1 = new ModuleRegistrationError("Error 1");
        const error2 = new ModuleRegistrationError("Error 2");
        const error3 = new ModuleRegistrationError("Error 3");

        vi.spyOn(moduleRegistry1, "updateDeferredRegistrations").mockReturnValueOnce(Promise.resolve([error1]));
        vi.spyOn(moduleRegistry2, "updateDeferredRegistrations").mockReturnValueOnce(Promise.resolve([error2]));
        vi.spyOn(moduleRegistry3, "updateDeferredRegistrations").mockReturnValueOnce(Promise.resolve([error3]));

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [
                moduleRegistry1,
                moduleRegistry2,
                moduleRegistry3
            ]),
            loggers: [new NoopLogger()]
        });

        const data = {
            foo: "bar"
        };

        const errors = await runtime.moduleManager.updateDeferredRegistrations(data);

        expect(errors.length).toBe(3);
        expect(errors[0]).toBe(error1);
        expect(errors[1]).toBe(error2);
        expect(errors[2]).toBe(error3);
    });
});

describe.concurrent("getAreModulesRegistered", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        readonly #registrationStatus: ModuleRegistrationStatus;

        constructor(registrationStatus: ModuleRegistrationStatus) {
            super();

            this.#registrationStatus = registrationStatus;
        }

        get id(): string {
            throw new Error("Method not implemented.");
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        removeStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        get registrationStatus(): ModuleRegistrationStatus {
            return this.#registrationStatus;
        }
    }

    test.concurrent("when no registries are added, return true", ({ expect }) => {
        const manager = new ModuleManager(new DummyRuntime(), []);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });

    test.concurrent("when there is a single registry and the registration status is \"none\", return false", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("none");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesRegistered()).toBeFalsy();
    });

    test.concurrent("when there is a single registry and the registration status is \"registering-modules\", return false", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("registering-modules");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesRegistered()).toBeFalsy();
    });

    test.concurrent("when there is a single registry and the registration status is \"modules-registered\", return true", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("modules-registered");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });

    test.concurrent("when there is a single registry and the registration status is \"registering-deferred-registration\", return true", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("registering-deferred-registration");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });

    test.concurrent("when there is a single registry and the registration status is \"ready\", return true", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });

    test.concurrent("when there are multiple registries and the modules of all the registries are not registered, return false", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("none");
        const moduleRegistry2 = new DummyModuleRegistry("registering-modules");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2
        ]);

        expect(manager.getAreModulesRegistered()).toBeFalsy();
    });

    test.concurrent("when there are multiple registries and the modules of all the registries are registered, return true", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("modules-registered");
        const moduleRegistry2 = new DummyModuleRegistry("registering-deferred-registration");
        const moduleRegistry3 = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });

    test.concurrent("when there are multiple registries and no modules are registered for a registry, and the modules of the remaining registries are registered, return true", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("none");
        const moduleRegistry2 = new DummyModuleRegistry("modules-registered");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2
        ]);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });

    test.concurrent("when there are multiple registries and all registries includes modules with deferred registrations are registered, return true", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("registering-deferred-registration");
        const moduleRegistry2 = new DummyModuleRegistry("registering-deferred-registration");
        const moduleRegistry3 = new DummyModuleRegistry("registering-deferred-registration");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        expect(manager.getAreModulesRegistered()).toBeTruthy();
    });
});

describe.concurrent("getAreModulesReady", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        readonly #registrationStatus: ModuleRegistrationStatus;

        constructor(registrationStatus: ModuleRegistrationStatus) {
            super();

            this.#registrationStatus = registrationStatus;
        }

        get id(): string {
            throw new Error("Method not implemented.");
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        removeStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        get registrationStatus(): ModuleRegistrationStatus {
            return this.#registrationStatus;
        }
    }

    test.concurrent("when no registries are added, return true", ({ expect }) => {
        const manager = new ModuleManager(new DummyRuntime(), []);

        expect(manager.getAreModulesReady()).toBeTruthy();
    });

    test.concurrent("when there is a single registry and the registration status is \"none\", return false", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("none");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesReady()).toBeFalsy();
    });

    test.concurrent("when there is a single registry and the registration status is \"modules-registered\", return false", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("modules-registered");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesReady()).toBeFalsy();
    });

    test.concurrent("when there is a single registry and the registration status is \"registering-deferred-registration\", return false", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("registering-deferred-registration");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesReady()).toBeFalsy();
    });

    test.concurrent("when there is a single registry and the registration status is \"registering-modules\", return false", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("registering-modules");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesReady()).toBeFalsy();
    });

    test.concurrent("when there is a single registry and the registration status is \"ready\", return true", ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry
        ]);

        expect(manager.getAreModulesReady()).toBeTruthy();
    });

    test.concurrent("where there are multiple registries and the modules of all the registries are not ready, return false", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("none");
        const moduleRegistry2 = new DummyModuleRegistry("modules-registered");
        const moduleRegistry3 = new DummyModuleRegistry("registering-deferred-registration");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        expect(manager.getAreModulesReady()).toBeFalsy();
    });

    test.concurrent("when there are multiple registries and no modules are ready for a registry, and the modules of the remaining registries are ready, return true", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("ready");
        const moduleRegistry2 = new DummyModuleRegistry("none");
        const moduleRegistry3 = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        expect(manager.getAreModulesReady()).toBeTruthy();
    });

    test.concurrent("where there are multiple registries and the modules of all the registries are ready, return true", ({ expect }) => {
        const moduleRegistry1 = new DummyModuleRegistry("ready");
        const moduleRegistry2 = new DummyModuleRegistry("ready");
        const moduleRegistry3 = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            moduleRegistry1,
            moduleRegistry2,
            moduleRegistry3
        ]);

        expect(manager.getAreModulesReady()).toBeTruthy();
    });
});

describe.concurrent("modules registered listeners", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        readonly #registrationStatus: ModuleRegistrationStatus;
        readonly #statusChangedListeners = new Set<ModuleRegistrationStatusChangedListener>();

        constructor(registrationStatus: ModuleRegistrationStatus) {
            super();

            this.#registrationStatus = registrationStatus;
        }

        get id(): string {
            throw new Error("Method not implemented.");
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            return Promise.resolve([]);
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
            this.#statusChangedListeners.add(callback);

            return () => {
                this.removeStatusChangedListener(callback);
            };
        }

        removeStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
            this.#statusChangedListeners.delete(callback);
        }

        notifyStatusListeners() {
            this.#statusChangedListeners.forEach(x => {
                x();
            });
        }

        get statusListenersCount() {
            return this.#statusChangedListeners.size;
        }

        get registrationStatus(): ModuleRegistrationStatus {
            return this.#registrationStatus;
        }
    }

    test.concurrent("can register a listener", ({ expect }) => {
        const manager = new ModuleManager(new DummyRuntime(), []);

        manager.registerModulesRegisteredListener(() => {});
        manager.registerModulesRegisteredListener(() => {});
        manager.registerModulesRegisteredListener(() => {});

        expect(manager.listenersCount).toBe(3);
    });

    test.concurrent("when a listener is registered, the listener is added to every registry", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("none");
        const registry2 = new DummyModuleRegistry("none");
        const registry3 = new DummyModuleRegistry("none");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        manager.registerModulesRegisteredListener(() => {});

        expect(registry1.statusListenersCount).toBe(1);
        expect(registry2.statusListenersCount).toBe(1);
        expect(registry3.statusListenersCount).toBe(1);
    });

    test.concurrent("can remove a listener", ({ expect }) => {
        const manager = new ModuleManager(new DummyRuntime(), []);

        const listener1 = () => {};
        const listener2 = () => {};
        const listener3 = () => {};

        manager.registerModulesRegisteredListener(listener1);
        manager.registerModulesRegisteredListener(listener2);
        manager.registerModulesRegisteredListener(listener3);

        manager.removeModulesRegisteredListener(listener2);

        expect(manager.listenersCount).toBe(2);

        manager.removeModulesRegisteredListener(listener3);

        expect(manager.listenersCount).toBe(1);

        manager.removeModulesRegisteredListener(listener1);

        expect(manager.listenersCount).toBe(0);
    });

    test.concurrent("when a listener is removed, the listener is removed from every registry", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("none");
        const registry2 = new DummyModuleRegistry("none");
        const registry3 = new DummyModuleRegistry("none");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        const listener1 = () => {};
        const listener2 = () => {};
        const listener3 = () => {};

        manager.registerModulesRegisteredListener(listener1);
        manager.registerModulesRegisteredListener(listener2);
        manager.registerModulesRegisteredListener(listener3);

        expect(registry1.statusListenersCount).toBe(3);
        expect(registry1.statusListenersCount).toBe(3);
        expect(registry1.statusListenersCount).toBe(3);

        manager.removeModulesRegisteredListener(listener1);

        expect(registry1.statusListenersCount).toBe(2);
        expect(registry2.statusListenersCount).toBe(2);
        expect(registry3.statusListenersCount).toBe(2);

        manager.removeModulesRegisteredListener(listener2);

        expect(registry1.statusListenersCount).toBe(1);
        expect(registry2.statusListenersCount).toBe(1);
        expect(registry3.statusListenersCount).toBe(1);

        manager.removeModulesRegisteredListener(listener3);

        expect(registry1.statusListenersCount).toBe(0);
        expect(registry2.statusListenersCount).toBe(0);
        expect(registry3.statusListenersCount).toBe(0);
    });

    test.concurrent("when the modules are registered, every listener is executed", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("modules-registered");
        const registry2 = new DummyModuleRegistry("ready");
        const registry3 = new DummyModuleRegistry("registering-deferred-registration");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        const listener1 = vi.fn();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        manager.registerModulesRegisteredListener(listener1);
        manager.registerModulesRegisteredListener(listener2);
        manager.registerModulesRegisteredListener(listener3);

        registry1.notifyStatusListeners();
        registry2.notifyStatusListeners();
        registry3.notifyStatusListeners();

        // It's intended that a notifier can only be called once.
        expect(listener1).toHaveBeenCalledOnce();
        expect(listener2).toHaveBeenCalledOnce();
        expect(listener3).toHaveBeenCalledOnce();
    });

    test.concurrent("when some modules are not registered, do not execute the listeners", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("modules-registered");
        const registry2 = new DummyModuleRegistry("registering-modules");
        const registry3 = new DummyModuleRegistry("registering-deferred-registration");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        const listener1 = vi.fn();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        manager.registerModulesRegisteredListener(listener1);
        manager.registerModulesRegisteredListener(listener2);
        manager.registerModulesRegisteredListener(listener3);

        registry1.notifyStatusListeners();
        registry2.notifyStatusListeners();
        registry3.notifyStatusListeners();

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
        expect(listener3).not.toHaveBeenCalled();
    });
});

describe.concurrent("modules ready listeners", () => {
    class DummyModuleRegistry extends ModuleRegistry {
        readonly #registrationStatus: ModuleRegistrationStatus;
        readonly #statusChangedListeners = new Set<ModuleRegistrationStatusChangedListener>();

        constructor(registrationStatus: ModuleRegistrationStatus) {
            super();

            this.#registrationStatus = registrationStatus;
        }

        get id(): string {
            throw new Error("Method not implemented.");
        }

        registerModules(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            return Promise.resolve([]);
        }

        updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
            throw new Error("Method not implemented.");
        }

        registerStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
            this.#statusChangedListeners.add(callback);

            return () => {
                this.removeStatusChangedListener(callback);
            };
        }

        removeStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
            this.#statusChangedListeners.delete(callback);
        }

        notifyStatusListeners() {
            this.#statusChangedListeners.forEach(x => {
                x();
            });
        }

        get statusListenersCount() {
            return this.#statusChangedListeners.size;
        }

        get registrationStatus(): ModuleRegistrationStatus {
            return this.#registrationStatus;
        }
    }

    test.concurrent("can register a listener", ({ expect }) => {
        const manager = new ModuleManager(new DummyRuntime(), []);

        manager.registerModulesReadyListener(() => {});
        manager.registerModulesReadyListener(() => {});
        manager.registerModulesReadyListener(() => {});

        expect(manager.listenersCount).toBe(3);
    });

    test.concurrent("when a listener is registered, the listener is added to every registry", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("none");
        const registry2 = new DummyModuleRegistry("none");
        const registry3 = new DummyModuleRegistry("none");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        manager.registerModulesReadyListener(() => {});

        expect(registry1.statusListenersCount).toBe(1);
        expect(registry2.statusListenersCount).toBe(1);
        expect(registry3.statusListenersCount).toBe(1);
    });

    test.concurrent("can remove a listener", ({ expect }) => {
        const manager = new ModuleManager(new DummyRuntime(), []);

        const listener1 = () => {};
        const listener2 = () => {};
        const listener3 = () => {};

        manager.registerModulesReadyListener(listener1);
        manager.registerModulesReadyListener(listener2);
        manager.registerModulesReadyListener(listener3);

        manager.removeModulesReadyListener(listener2);

        expect(manager.listenersCount).toBe(2);

        manager.removeModulesReadyListener(listener3);

        expect(manager.listenersCount).toBe(1);

        manager.removeModulesReadyListener(listener1);

        expect(manager.listenersCount).toBe(0);
    });

    test.concurrent("when a listener is removed, the listener is removed from every registry", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("none");
        const registry2 = new DummyModuleRegistry("none");
        const registry3 = new DummyModuleRegistry("none");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        const listener1 = () => {};
        const listener2 = () => {};
        const listener3 = () => {};

        manager.registerModulesReadyListener(listener1);
        manager.registerModulesReadyListener(listener2);
        manager.registerModulesReadyListener(listener3);

        expect(registry1.statusListenersCount).toBe(3);
        expect(registry1.statusListenersCount).toBe(3);
        expect(registry1.statusListenersCount).toBe(3);

        manager.removeModulesReadyListener(listener1);

        expect(registry1.statusListenersCount).toBe(2);
        expect(registry2.statusListenersCount).toBe(2);
        expect(registry3.statusListenersCount).toBe(2);

        manager.removeModulesReadyListener(listener2);

        expect(registry1.statusListenersCount).toBe(1);
        expect(registry2.statusListenersCount).toBe(1);
        expect(registry3.statusListenersCount).toBe(1);

        manager.removeModulesReadyListener(listener3);

        expect(registry1.statusListenersCount).toBe(0);
        expect(registry2.statusListenersCount).toBe(0);
        expect(registry3.statusListenersCount).toBe(0);
    });

    test.concurrent("when the modules are ready, every listener is executed", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("ready");
        const registry2 = new DummyModuleRegistry("ready");
        const registry3 = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        const listener1 = vi.fn();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        manager.registerModulesReadyListener(listener1);
        manager.registerModulesReadyListener(listener2);
        manager.registerModulesReadyListener(listener3);

        registry1.notifyStatusListeners();
        registry2.notifyStatusListeners();
        registry3.notifyStatusListeners();

        // It's intended that a notifier can only be called once.
        expect(listener1).toHaveBeenCalledOnce();
        expect(listener2).toHaveBeenCalledOnce();
        expect(listener3).toHaveBeenCalledOnce();
    });

    test.concurrent("when some modules are not ready, do not execute the listeners", ({ expect }) => {
        const registry1 = new DummyModuleRegistry("ready");
        const registry2 = new DummyModuleRegistry("registering-modules");
        const registry3 = new DummyModuleRegistry("ready");

        const manager = new ModuleManager(new DummyRuntime(), [
            registry1,
            registry2,
            registry3
        ]);

        const listener1 = vi.fn();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        manager.registerModulesReadyListener(listener1);
        manager.registerModulesReadyListener(listener2);
        manager.registerModulesReadyListener(listener3);

        registry1.notifyStatusListeners();
        registry2.notifyStatusListeners();
        registry3.notifyStatusListeners();

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
        expect(listener3).not.toHaveBeenCalled();
    });
});
