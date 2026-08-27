import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import { Plugin, type DeferredRegistrationScopeCompletionFunction, type DeferredRegistrationScopeOptions } from "../src/plugins/Plugin.ts";
import { ModuleManager } from "../src/registration/ModuleManager.ts";
import { ModuleRegistrationError, ModuleRegistrationStatus, ModuleRegistrationStatusChangedListener, ModuleRegistry } from "../src/registration/ModuleRegistry.ts";
import { Runtime } from "../src/runtime/Runtime.ts";

class DummyRuntime extends Runtime {
    // A single instance rather than a new one per access, otherwise the logger cannot be spied on.
    readonly #logger = new NoopLogger();

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

    getNavigationItemsByMenu() {
        return new Map();
    }

    startDeferredRegistrationScope(): void {
    }

    completeDeferredRegistrationScope(): void {
    }

    get logger() {
        return this.#logger;
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

        setAsReady(): void {
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

        expect(spy1).toHaveBeenCalledExactlyOnceWith(runtime, [fct1], undefined);
        expect(spy2).toHaveBeenCalledExactlyOnceWith(runtime, [fct2, fct3], undefined);
        expect(spy3).toHaveBeenCalledExactlyOnceWith(runtime, [fct4], undefined);
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

    // test.concurrent("when a module is registered for a registry that has not been added, an error is thrown", async ({ expect }) => {
    //     const moduleRegistry1 = new DummyModuleRegistry("registry-1");
    //     const moduleRegistry2 = new DummyModuleRegistry("registry-2");
    //     const moduleRegistry3 = new DummyModuleRegistry("registry-3");

    //     const runtime = new DummyRuntime();

    //     const manager = new ModuleManager(runtime, [
    //         moduleRegistry1,
    //         moduleRegistry2,
    //         moduleRegistry3
    //     ]);

    //     const definition1 = { registryId: "registry-1", definition: () => {} };
    //     const definition2 = { registryId: "registry-2", definition: () => {} };
    //     const definition3 = { registryId: "registry-345", definition: () => {} };

    //     await expect(() => manager.registerModules([
    //         definition1,
    //         definition2,
    //         definition3
    //     ])).rejects.toThrow("Cannot find a module registry with id \"registry-345\"");
    // });

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

        setAsReady(): void {
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

        expect(spy1).toHaveBeenCalledExactlyOnceWith(runtime, data);
        expect(spy2).toHaveBeenCalledExactlyOnceWith(runtime, data);
        expect(spy3).toHaveBeenCalledExactlyOnceWith(runtime, data);
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

        expect(startScopeSpy).toHaveBeenCalledOnce();
        expect(completeScopeSpy).toHaveBeenCalledOnce();
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

        expect(completeScopeSpy).toHaveBeenCalledOnce();
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

        setAsReady(): void {
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

        expect(spy1).toHaveBeenCalledWith(runtime, data);
        expect(spy2).toHaveBeenCalledWith(runtime, data);
        expect(spy3).toHaveBeenCalledWith(runtime, data);
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

        expect(startScopeSpy).toHaveBeenCalledOnce();
        expect(completeScopeSpy).toHaveBeenCalledOnce();
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

        expect(completeScopeSpy).toHaveBeenCalledOnce();
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

describe.concurrent("plugins deferred registration scope lifecycle", () => {
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
            return Promise.resolve([]);
        }

        registerStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        removeStatusChangedListener(): void {
            throw new Error("Method not implemented.");
        }

        setAsReady(): void {
            throw new Error("Method not implemented.");
        }

        get registrationStatus(): ModuleRegistrationStatus {
            throw new Error("Method not implemented.");
        }
    }

    class DummyPlugin extends Plugin {}

    type OnDeferredRegistrationScopeStartedHandler = (options: DeferredRegistrationScopeOptions) => DeferredRegistrationScopeCompletionFunction | void;

    class DummyScopeAwarePlugin extends Plugin {
        readonly #handler: OnDeferredRegistrationScopeStartedHandler;

        constructor(name: string, runtime: Runtime, handler: OnDeferredRegistrationScopeStartedHandler) {
            super(name, runtime);

            this.#handler = handler;
        }

        onDeferredRegistrationScopeStarted(options: DeferredRegistrationScopeOptions) {
            return this.#handler(options);
        }
    }

    test.concurrent("when the deferred registrations are registered, the plugins are notified with the \"register\" operation and a non transactional scope", async ({ expect }) => {
        const handler = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, handler)],
            loggers: [new NoopLogger()]
        });

        await runtime.moduleManager.registerDeferredRegistrations({ foo: "bar" });

        expect(handler).toHaveBeenCalledExactlyOnceWith({
            operation: "register",
            transactional: false
        });
    });

    test.concurrent("when the deferred registrations are updated, the plugins are notified with the \"update\" operation and a transactional scope", async ({ expect }) => {
        const handler = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, handler)],
            loggers: [new NoopLogger()]
        });

        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        expect(handler).toHaveBeenCalledExactlyOnceWith({
            operation: "update",
            transactional: true
        });
    });

    test.concurrent("every plugin declaring the hook is notified", async ({ expect }) => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyScopeAwarePlugin("dummy-1", x, handler1),
                x => new DummyScopeAwarePlugin("dummy-2", x, handler2)
            ],
            loggers: [new NoopLogger()]
        });

        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        expect(handler1).toHaveBeenCalledOnce();
        expect(handler2).toHaveBeenCalledOnce();
    });

    test.concurrent("when a plugin doesn't declare the hook, the plugin is skipped", async ({ expect }) => {
        const handler = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyPlugin("dummy-without-hook", x),
                x => new DummyScopeAwarePlugin("dummy-with-hook", x, handler)
            ],
            loggers: [new NoopLogger()]
        });

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(handler).toHaveBeenCalledOnce();
    });

    test.concurrent("the plugins are notified before the modules deferred registrations are updated, and the completion functions are executed after, while the runtime scope is still open", async ({ expect }) => {
        const calls: string[] = [];

        const moduleRegistry = new DummyModuleRegistry();

        vi.spyOn(moduleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
            calls.push("update-modules");

            return Promise.resolve([]);
        });

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [moduleRegistry]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {
                calls.push("scope-started");

                return () => {
                    calls.push("scope-completed");
                };
            })],
            loggers: [new NoopLogger()]
        });

        vi.spyOn(runtime, "startDeferredRegistrationScope").mockImplementation(() => {
            calls.push("start-runtime-scope");
        });

        vi.spyOn(runtime, "completeDeferredRegistrationScope").mockImplementation(() => {
            calls.push("complete-runtime-scope");
        });

        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        expect(calls).toStrictEqual([
            "start-runtime-scope",
            "scope-started",
            "update-modules",
            "scope-completed",
            "complete-runtime-scope"
        ]);
    });

    test.concurrent("when the hook doesn't return a completion function, the run completes", async ({ expect }) => {
        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {})],
            loggers: [new NoopLogger()]
        });

        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(completeScopeSpy).toHaveBeenCalledOnce();
    });

    test.concurrent("when the hook throws, the modules deferred registrations are still updated and the runtime scope is completed", async ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry();

        const updateSpy = vi.spyOn(moduleRegistry, "updateDeferredRegistrations");

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [moduleRegistry]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {
                throw new Error("Something went wrong!");
            })],
            loggers: [new NoopLogger()]
        });

        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(updateSpy).toHaveBeenCalledOnce();
        expect(completeScopeSpy).toHaveBeenCalledOnce();
    });

    test.concurrent("when the hook throws on the initial run, the modules still become ready", async ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry();

        const registerSpy = vi.spyOn(moduleRegistry, "registerDeferredRegistrations");

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [moduleRegistry]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {
                throw new Error("Something went wrong!");
            })],
            loggers: [new NoopLogger()]
        });

        // A rejection here would leave the application on its bootstrapping fallback forever, because the modules
        // only become ready at the end of the registries "registerDeferredRegistrations".
        await expect(runtime.moduleManager.registerDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(registerSpy).toHaveBeenCalledOnce();
    });

    test.concurrent("when the hook throws, the error is logged with the plugin name", async ({ expect }) => {
        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {
                throw new Error("Something went wrong!");
            })],
            loggers: [new NoopLogger()]
        });

        const withTextSpy = vi.spyOn(runtime.logger, "withText");

        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        // NoopLogger declares "withText" without parameters, hence the cast to read the logged message.
        const messages = withTextSpy.mock.calls.map(x => (x as unknown as [string])[0]);

        expect(withTextSpy).toHaveBeenCalledOnce();
        expect(messages[0]).toContain("\"dummy\"");
    });

    test.concurrent("when a plugin hook throws, the remaining plugins are still notified and their completion functions are executed", async ({ expect }) => {
        const completionFunction = vi.fn();
        const handler = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyScopeAwarePlugin("dummy-1", x, () => completionFunction),
                x => new DummyScopeAwarePlugin("dummy-2", x, () => {
                    throw new Error("Something went wrong!");
                }),
                x => new DummyScopeAwarePlugin("dummy-3", x, handler)
            ],
            loggers: [new NoopLogger()]
        });

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(completionFunction).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledOnce();
    });

    test.concurrent("when the modules deferred registrations throw, the completion functions are executed", async ({ expect }) => {
        const completionFunction = vi.fn();

        const moduleRegistry = new DummyModuleRegistry();

        vi.spyOn(moduleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
            throw new Error("Something went wrong!");
        });

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [moduleRegistry]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => completionFunction)],
            loggers: [new NoopLogger()]
        });

        await expect(() => runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).rejects.toThrow("Something went wrong!");

        expect(completionFunction).toHaveBeenCalledOnce();
    });

    test.concurrent("when a completion function throws, the remaining completion functions are executed, the runtime scope is completed and the run still resolves", async ({ expect }) => {
        const completionFunction = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyScopeAwarePlugin("dummy-1", x, () => () => {
                    throw new Error("Something went wrong!");
                }),
                x => new DummyScopeAwarePlugin("dummy-2", x, () => completionFunction)
            ],
            loggers: [new NoopLogger()]
        });

        const completeScopeSpy = vi.spyOn(runtime, "completeDeferredRegistrationScope");

        // Rethrowing would abort the caller before it notifies the app router store, leaving the navigation items
        // that were just committed unrendered.
        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(completionFunction).toHaveBeenCalledOnce();
        expect(completeScopeSpy).toHaveBeenCalledOnce();
    });

    test.concurrent("when a completion function throws and the run failed, the run error is not masked", async ({ expect }) => {
        const moduleRegistry = new DummyModuleRegistry();

        vi.spyOn(moduleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
            throw new Error("The modules failed!");
        });

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [moduleRegistry]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => () => {
                throw new Error("The completion function failed!");
            })],
            loggers: [new NoopLogger()]
        });

        await expect(() => runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).rejects.toThrow("The modules failed!");
    });

    test.concurrent("on the initial run, the plugins are notified before the modules deferred registrations are registered, and the completion functions are executed after, while the runtime scope is still open", async ({ expect }) => {
        const calls: string[] = [];

        const moduleRegistry = new DummyModuleRegistry();

        vi.spyOn(moduleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
            calls.push("register-modules");

            return Promise.resolve([]);
        });

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [moduleRegistry]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {
                calls.push("scope-started");

                return () => {
                    calls.push("scope-completed");
                };
            })],
            loggers: [new NoopLogger()]
        });

        vi.spyOn(runtime, "startDeferredRegistrationScope").mockImplementation(() => {
            calls.push("start-runtime-scope");
        });

        vi.spyOn(runtime, "completeDeferredRegistrationScope").mockImplementation(() => {
            calls.push("complete-runtime-scope");
        });

        await runtime.moduleManager.registerDeferredRegistrations({ foo: "bar" });

        expect(calls).toStrictEqual([
            "start-runtime-scope",
            "scope-started",
            "register-modules",
            "scope-completed",
            "complete-runtime-scope"
        ]);
    });

    test.concurrent("the completion functions are executed in the order the plugins are registered", async ({ expect }) => {
        const calls: string[] = [];

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyScopeAwarePlugin("dummy-1", x, () => () => { calls.push("dummy-1"); }),
                x => new DummyScopeAwarePlugin("dummy-2", x, () => () => { calls.push("dummy-2"); }),
                x => new DummyScopeAwarePlugin("dummy-3", x, () => () => { calls.push("dummy-3"); })
            ],
            loggers: [new NoopLogger()]
        });

        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        expect(calls).toStrictEqual(["dummy-1", "dummy-2", "dummy-3"]);
    });

    test.concurrent("when multiple completion functions throw, every error is logged", async ({ expect }) => {
        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyScopeAwarePlugin("dummy-1", x, () => () => {
                    throw new Error("The first completion function failed!");
                }),
                x => new DummyScopeAwarePlugin("dummy-2", x, () => () => {
                    throw new Error("The second completion function failed!");
                })
            ],
            loggers: [new NoopLogger()]
        });

        const withTextSpy = vi.spyOn(runtime.logger, "withText");

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(withTextSpy).toHaveBeenCalledTimes(2);
    });

    test.concurrent("when a completion function throws, the error is logged", async ({ expect }) => {
        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => () => {
                throw new Error("Something went wrong!");
            })],
            loggers: [new NoopLogger()]
        });

        const withTextSpy = vi.spyOn(runtime.logger, "withText");

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);

        expect(withTextSpy).toHaveBeenCalledOnce();
    });

    test.concurrent("when the hook returns a value that is not a function, the value is ignored", async ({ expect }) => {
        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            // An async hook is rejected by type checking, but a plugin authored in JavaScript could return a promise.
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => Promise.resolve() as unknown as DeferredRegistrationScopeCompletionFunction)],
            loggers: [new NoopLogger()]
        });

        await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toStrictEqual([]);
    });

    test.concurrent("when a plugin mutates the options it receives, the remaining plugins are not affected", async ({ expect }) => {
        const handler = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [
                x => new DummyScopeAwarePlugin("dummy-1", x, options => {
                    options.transactional = false;
                    options.operation = "register";
                }),
                x => new DummyScopeAwarePlugin("dummy-2", x, handler)
            ],
            loggers: [new NoopLogger()]
        });

        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        expect(handler).toHaveBeenCalledExactlyOnceWith({
            operation: "update",
            transactional: true
        });
    });

    test.concurrent("when the runtime fails to complete its scope, the error bubbles up", async ({ expect }) => {
        const completionFunction = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => completionFunction)],
            loggers: [new NoopLogger()]
        });

        vi.spyOn(runtime, "completeDeferredRegistrationScope").mockImplementation(() => {
            throw new Error("The runtime scope failed to complete!");
        });

        await expect(() => runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).rejects.toThrow("The runtime scope failed to complete!");

        // The completion functions are executed before the runtime completes its scope, so they still ran.
        expect(completionFunction).toHaveBeenCalledOnce();
    });

    test.concurrent("the plugins are notified for both the initial run and the update run", async ({ expect }) => {
        const handler = vi.fn();

        const runtime = new DummyRuntime({
            moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
            plugins: [x => new DummyScopeAwarePlugin("dummy", x, handler)],
            loggers: [new NoopLogger()]
        });

        await runtime.moduleManager.registerDeferredRegistrations({ foo: "bar" });
        await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenNthCalledWith(1, { operation: "register", transactional: false });
        expect(handler).toHaveBeenNthCalledWith(2, { operation: "update", transactional: true });
    });

    // The runtime listeners are the non plugin surface of the same hook. Their own mechanics (disposer,
    // ordering, error isolation) live in Runtime.test.ts, these pin that both surfaces share one driver.
    describe.concurrent("runtime listeners", () => {
        test.concurrent("when the deferred registrations are registered, the listeners are notified with the \"register\" operation and a non transactional scope", async ({ expect }) => {
            const listener = vi.fn();

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
                loggers: [new NoopLogger()]
            });

            runtime.registerDeferredRegistrationScopeStartedListener(listener);

            await runtime.moduleManager.registerDeferredRegistrations({ foo: "bar" });

            expect(listener).toHaveBeenCalledExactlyOnceWith({
                operation: "register",
                transactional: false
            });
        });

        test.concurrent("when the deferred registrations are updated, the listeners are notified with the \"update\" operation and a transactional scope", async ({ expect }) => {
            const listener = vi.fn();

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
                loggers: [new NoopLogger()]
            });

            runtime.registerDeferredRegistrationScopeStartedListener(listener);

            await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

            expect(listener).toHaveBeenCalledExactlyOnceWith({
                operation: "update",
                transactional: true
            });
        });

        test.concurrent("the listeners are notified before the modules", async ({ expect }) => {
            const calls: string[] = [];

            const moduleRegistry = new DummyModuleRegistry();

            vi.spyOn(moduleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
                calls.push("module");

                return Promise.resolve([]);
            });

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [moduleRegistry]),
                loggers: [new NoopLogger()]
            });

            runtime.registerDeferredRegistrationScopeStartedListener(() => {
                calls.push("listener");
            });

            await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

            expect(calls).toEqual(["listener", "module"]);
        });

        test.concurrent("the plugins are notified before the listeners", async ({ expect }) => {
            const calls: string[] = [];

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
                plugins: [x => new DummyScopeAwarePlugin("dummy", x, () => {
                    calls.push("plugin");
                })],
                loggers: [new NoopLogger()]
            });

            runtime.registerDeferredRegistrationScopeStartedListener(() => {
                calls.push("listener");
            });

            await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

            expect(calls).toEqual(["plugin", "listener"]);
        });

        test.concurrent("a completion function returned by a listener runs after the modules, before the runtime scope is completed", async ({ expect }) => {
            const calls: string[] = [];

            const moduleRegistry = new DummyModuleRegistry();

            vi.spyOn(moduleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
                calls.push("module");

                return Promise.resolve([]);
            });

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [moduleRegistry]),
                loggers: [new NoopLogger()]
            });

            vi.spyOn(runtime, "completeDeferredRegistrationScope").mockImplementation(() => {
                calls.push("complete-scope");
            });

            runtime.registerDeferredRegistrationScopeStartedListener(() => () => {
                calls.push("completion");
            });

            await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

            expect(calls).toEqual(["module", "completion", "complete-scope"]);
        });

        test.concurrent("when the modules deferred registrations throw, the completion functions are executed", async ({ expect }) => {
            const completionFunction = vi.fn();

            const moduleRegistry = new DummyModuleRegistry();

            vi.spyOn(moduleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
                throw new Error("Something went wrong!");
            });

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [moduleRegistry]),
                loggers: [new NoopLogger()]
            });

            runtime.registerDeferredRegistrationScopeStartedListener(() => completionFunction);

            await expect(() => runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).rejects.toThrow();

            expect(completionFunction).toHaveBeenCalledOnce();
        });

        test.concurrent("when a listener throws, the modules deferred registrations are still updated and the runtime scope is completed", async ({ expect }) => {
            const completeScopeSpy = vi.fn();

            const moduleRegistry = new DummyModuleRegistry();
            const updateSpy = vi.spyOn(moduleRegistry, "updateDeferredRegistrations");

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [moduleRegistry]),
                loggers: [new NoopLogger()]
            });

            vi.spyOn(runtime, "completeDeferredRegistrationScope").mockImplementation(completeScopeSpy);

            runtime.registerDeferredRegistrationScopeStartedListener(() => {
                throw new Error("Something went wrong!");
            });

            await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

            expect(updateSpy).toHaveBeenCalledOnce();
            expect(completeScopeSpy).toHaveBeenCalledOnce();
        });

        test.concurrent("when a completion function returned by a listener throws, the runtime scope is completed and the run still resolves", async ({ expect }) => {
            const completeScopeSpy = vi.fn();

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
                loggers: [new NoopLogger()]
            });

            vi.spyOn(runtime, "completeDeferredRegistrationScope").mockImplementation(completeScopeSpy);

            runtime.registerDeferredRegistrationScopeStartedListener(() => () => {
                throw new Error("Something went wrong!");
            });

            await expect(runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" })).resolves.toBeDefined();

            expect(completeScopeSpy).toHaveBeenCalledOnce();
        });

        test.concurrent("a removed listener is not notified by a run", async ({ expect }) => {
            const listener = vi.fn();

            const runtime = new DummyRuntime({
                moduleManager: x => new ModuleManager(x, [new DummyModuleRegistry()]),
                loggers: [new NoopLogger()]
            });

            const dispose = runtime.registerDeferredRegistrationScopeStartedListener(listener);

            dispose();

            await runtime.moduleManager.updateDeferredRegistrations({ foo: "bar" });

            expect(listener).not.toHaveBeenCalled();
        });
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

        setAsReady(): void {
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

        setAsReady(): void {
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

        setAsReady(): void {
            throw new Error("Method not implemented.");
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

        setAsReady(): void {
            throw new Error("Method not implemented.");
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
