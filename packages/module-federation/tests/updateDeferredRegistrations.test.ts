import { __setLocalModuleRegistry, LocalModuleRegistry, registerLocalModules, Runtime } from "@squide/core";
import { expect, test, vi } from "vitest";
import { registerDeferredRegistrations } from "../src/registerDeferredRegistrations.ts";
import { __setRemoteModuleRegistry, registerRemoteModules, RemoteModuleRegistry } from "../src/registerRemoteModules.ts";
import { updateDeferredRegistrations } from "../src/updateDeferredRegistrations.ts";

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
    }

    completeDeferredRegistrationScope(): void {
    }
}

test("update local and remote deferred registrations", async () => {
    const runtime = new DummyRuntime();

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const data = {
        foo: "bar"
    };

    await registerDeferredRegistrations(data, runtime);

    const localRegistrationsSpy = vi.spyOn(localModuleRegistry, "updateDeferredRegistrations");
    const remoteRegistrationsSpy = vi.spyOn(remoteModuleRegistry, "updateDeferredRegistrations");

    await updateDeferredRegistrations(data, runtime);

    expect(localRegistrationsSpy).toHaveBeenCalledWith(data, runtime);
    expect(remoteRegistrationsSpy).toHaveBeenCalledWith(data, runtime);
});

test("start and complete a deferred registration scope", async () => {
    const runtime = new DummyRuntime();

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const data = {
        foo: "bar"
    };

    await registerDeferredRegistrations(data, runtime);

    const startScopeSpy = vi.spyOn(runtime, "startDeferredRegistrationScope");
    const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

    await updateDeferredRegistrations(data, runtime);

    expect(startScopeSpy).toHaveBeenCalledTimes(1);
    expect(completeScopeSpy).toHaveBeenCalledTimes(1);
});

test("when an unmanaged error is thrown, complete the deferred registration scope", async () => {
    const runtime = new DummyRuntime();

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const data = {
        foo: "bar"
    };

    await registerDeferredRegistrations(data, runtime);

    vi.spyOn(localModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        throw new Error("Something went wrong!");
    });

    const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

    // Oddly, I can't get it to work with expect(() => {}).toThrow();
    try {
        await updateDeferredRegistrations(data, runtime);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
        // ....
    }

    expect(completeScopeSpy).toHaveBeenCalledTimes(1);
});
