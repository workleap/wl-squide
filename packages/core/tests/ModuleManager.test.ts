import { NoopLogger } from "@workleap/logging";
import { describe, test } from "vitest";
import { ModuleManager } from "../src/registration/ModuleManager.ts";
import { ModuleRegistrationError, ModuleRegistrationStatus, ModuleRegistry } from "../src/registration/moduleRegistry.ts";
import { Runtime } from "../src/runtime/runtime.ts";

// import { ModuleManager, ModuleRegistrationError, ModuleRegistrationStatus, ModuleRegistrationStatusChangedListener, ModuleRegistry, RegisterModulesOptions, Runtime } from "../src/index.ts";

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

// describe.concurrent("registerModules", () => {

// });

// describe.concurrent("registerDeferredRegistrations", () => {

// });

// describe.concurrent("updateDeferredRegistrations", () => {

// });

describe.concurrent("getAreModulesRegistered", () => {
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

// describe.concurrent("modules registered listeners", () => {

// });

// describe.concurrent("modules ready listeners", () => {

// });
