import { LocalModuleRegistry } from "@squide/core/internal";
import { bootstrap, FireflyRuntime, ModuleManager, toLocalModuleDefinitions } from "@squide/firefly";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { RemoteModuleRegistrationError, RemoteModuleRegistry, toRemoteModuleDefinitions } from "../src/RemoteModuleRegistry.ts";

test.concurrent("when remote modules are provided, register the remote modules", async ({ expect }) => {
    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            remoteModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    bootstrap(runtime, [
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" }
        ])
    ]);

    await vi.waitFor(() => expect(remoteModuleRegistry.registrationStatus).toBe("ready"));
});

test.concurrent("when local and remote modules are provided, register all the modules", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const localModules = toLocalModuleDefinitions([
        () => {}
    ]);

    const remoteModules = toRemoteModuleDefinitions([
        { name: "Dummy-1" }
    ]);

    bootstrap(runtime, [
        ...localModules,
        ...remoteModules
    ]);

    await vi.waitFor(() => expect(localModuleRegistry.registrationStatus).toBe("ready"));
    await vi.waitFor(() => expect(remoteModuleRegistry.registrationStatus).toBe("ready"));
});

test.concurrent("when an error occurs while registering a remote module and an onError function is provided, call the function with the error", async ({ expect }) => {
    const loadRemote = vi.fn().mockResolvedValue({
        register: () => {
            throw new Error("Dummy");
        }
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            remoteModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onError = vi.fn();

    bootstrap(runtime, [
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" }
        ])
    ], {
        onError
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(expect.any(RemoteModuleRegistrationError));
});
