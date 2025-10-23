import { LocalModuleRegistry, Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { areModulesReady } from "../src/areModulesReady.ts";
import { RemoteModuleRegistry } from "../src/registerRemoteModules.ts";

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

test.concurrent("when no modules are registered, return false", ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => {}
    }));

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeFalsy();
});

test.concurrent("when only local modules are registered and they are ready, return true", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => {}
    }));

    await localModuleRegistry.registerModules([
        () => {},
        () => {},
        () => {}
    ], runtime);

    await localModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when only remote modules are registered and they are ready, return true", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => {}
    }));

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await remoteModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when only local module deferred registrations are registered and they are ready, return true", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    await localModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when only remote module deferred registrations are registered and they are ready, return true", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await remoteModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when local module deferred registrations and remote module deferred registrations are registered and they are ready, return", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await localModuleRegistry.registerDeferredRegistrations({}, runtime);
    await remoteModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when local module deferred registrations and remote modules are registered and they are ready, return true", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await localModuleRegistry.registerDeferredRegistrations({}, runtime);
    await remoteModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when local modules and remote module deferred registrations are registered and they are ready, return true", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await localModuleRegistry.registerModules([
        () => {},
        () => {},
        () => {}
    ], runtime);

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await localModuleRegistry.registerDeferredRegistrations({}, runtime);
    await remoteModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeTruthy();
});

test.concurrent("when only local module deferred registrations are registered and they are not completed, return false", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeFalsy();
});

test.concurrent("when only remote module deferred registrations are registered and they are not completed, return false", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeFalsy();
});

test.concurrent("when local module deferred registrations and remote module deferred registrations are registered and they are not completed, return false", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeFalsy();
});

test.concurrent("when local module deferred registrations and remote module deferred registrations are registered and only the local module deferred registrations are completed, return false", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await localModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeFalsy();
});

test.concurrent("when local module deferred registrations and remote module deferred registrations are registered and only the remote module deferred registrations are completed, return false", async ({ expect }) => {
    const runtime = new DummyRuntime({ loggers: [new NoopLogger()] });
    const localModuleRegistry = new LocalModuleRegistry();

    const remoteModuleRegistry = new RemoteModuleRegistry(vi.fn().mockResolvedValue({
        register: () => () => {}
    }));

    await localModuleRegistry.registerModules([
        () => () => {},
        () => () => {},
        () => () => {}
    ], runtime);

    await remoteModuleRegistry.registerModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" },
        { name: "Dummy-3" }
    ], runtime);

    await remoteModuleRegistry.registerDeferredRegistrations({}, runtime);

    expect(areModulesReady(localModuleRegistry.registrationStatus, remoteModuleRegistry.registrationStatus)).toBeFalsy();
});
