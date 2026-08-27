import type { DeferredRegistrationScopeCompletionFunction, DeferredRegistrationScopeOptions } from "../plugins/Plugin.ts";
import { Runtime } from "../runtime/Runtime.ts";
import { ModuleRegistrationError, ModuleRegistry, RegisterModulesOptions } from "./ModuleRegistry.ts";
import { ModuleRegisterFunction } from "./registerModule.ts";

export type ModuleRegistrationStatusListener = () => void;

export interface ModuleDefinition<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown> {
    definition: ModuleRegisterFunction<TRuntime, TContext, TData> | Record<string, unknown>;
    registryId: string;
}

export class ModuleManager {
    private readonly runtime: Runtime;
    private readonly moduleRegistries: ModuleRegistry[];
    private readonly listenerRefs = new Map<ModuleRegistrationStatusListener, ModuleRegistrationStatusListener>();

    constructor(runtime: Runtime, moduleRegistries: ModuleRegistry[]) {
        this.runtime = runtime;
        this.moduleRegistries = moduleRegistries;
    }

    addModuleRegistry(moduleRegistry: ModuleRegistry) {
        this.moduleRegistries.push(moduleRegistry);
    }

    async registerModules<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(definitions: ModuleDefinition<TRuntime, TContext, TData>[], options?: RegisterModulesOptions<TContext>) {
        const errors: ModuleRegistrationError[] = [];

        // {
        //     local: [
        //         { registryId: "local", definition: () => ... },
        //         { registryId: "local", definition: () => ... }
        //     ],
        //     remote: [
        //         { registryId: "remote", definition: {...} },
        //         { registryId: "remote", definition: {...} }
        //     ]
        // }
        const definitionsByRegistryId = Object.groupBy(definitions, x => x.registryId);

        // It's important to always to though all the registered registries even if there's no module definitions.
        // Using Promise.all rather than Promise.allSettled to throw any errors that occurs.
        await Promise.all(this.moduleRegistries.map(async x => {
            const registryDefinitions = definitionsByRegistryId[x.id];
            const modules = registryDefinitions ? registryDefinitions.map(y => y.definition) : [];

            const registrationErrors = await x.registerModules(this.runtime, modules, options);

            errors.push(...registrationErrors);
        }));

        return errors;
    }

    // Brackets a deferred registration run with the runtime's scope and the plugins "onDeferredRegistrationScopeStarted"
    // hook. Plugins are notified before any module runs and their completion functions are executed once the run has
    // settled, while the runtime's scope is still open.
    async #withDeferredRegistrationScope<T>(options: DeferredRegistrationScopeOptions, run: () => Promise<T>) {
        this.runtime.startDeferredRegistrationScope({
            transactional: options.transactional
        });

        const completionFunctions: DeferredRegistrationScopeCompletionFunction[] = [];

        let result: T;
        let hasCompletionError = false;
        let completionError: unknown;

        try {
            // Notifying the plugins is the first statement of the "try" block so that a throwing hook fails fast, before
            // any module has registered anything, while the "finally" block still releases the runtime's scope.
            // The plugins are retrieved lazily because the runtime creates its module manager before its plugins.
            for (const plugin of this.runtime.plugins) {
                // A copy per plugin, otherwise a plugin mutating the options would change what the next plugins observe.
                const completionFunction = plugin.onDeferredRegistrationScopeStarted?.({ ...options });

                // A hook must be synchronous. Type checking rejects an async hook, but a plugin authored in JavaScript
                // would otherwise have its promise stored as a completion function and fail with an unrelated error.
                if (typeof completionFunction === "function") {
                    completionFunctions.push(completionFunction);
                }
            }

            result = await run();
        } finally {
            // Every completion function is executed, even if a previous one threw, otherwise a single faulty plugin
            // would prevent the other plugins from committing their registry.
            for (const completionFunction of completionFunctions) {
                try {
                    completionFunction();
                } catch (error: unknown) {
                    this.runtime.logger
                        .withText("[squide] An error occured while completing a plugin deferred registration scope.")
                        .withError(error as Error)
                        .error();

                    // A dedicated boolean rather than a truthiness check on the error: a plugin throwing a falsy value
                    // must not be swallowed, and the first error must remain the one that is rethrown.
                    if (!hasCompletionError) {
                        hasCompletionError = true;
                        completionError = error;
                    }
                }
            }

            // The runtime's scope must always be completed, even when a completion function threw, otherwise every
            // subsequent deferred registration run would throw for the lifetime of the runtime.
            this.runtime.completeDeferredRegistrationScope();
        }

        // Only reachable when the run succeeded, the "finally" block above lets the run error bubble up on its own.
        // A completion error must never be thrown over a run error, it would hide the root cause of the failure.
        if (hasCompletionError) {
            throw completionError;
        }

        return result;
    }

    async registerDeferredRegistrations<TData = unknown>(data?: TData) {
        return this.#withDeferredRegistrationScope({ operation: "register", transactional: false }, async () => {
            const errors: ModuleRegistrationError[] = [];

            // Using Promise.all rather than Promise.allSettled to throw any errors that occurs.
            await Promise.all(this.moduleRegistries.map(async x => {
                const registrationErrors = await x.registerDeferredRegistrations(this.runtime, data);

                errors.push(...registrationErrors);
            }));

            return errors;
        });
    }

    async updateDeferredRegistrations<TData = unknown>(data?: TData) {
        return this.#withDeferredRegistrationScope({ operation: "update", transactional: true }, async () => {
            const errors: ModuleRegistrationError[] = [];

            // IMPORTANT: Currently cannot make this a concurrent operation because it cause errors
            // with the Honeycomb telemetry due to "active spans".
            for (const x of this.moduleRegistries) {
                const registrationErrors = await x.updateDeferredRegistrations(this.runtime, data);

                errors.push(...registrationErrors);
            };

            return errors;
        });
    }

    getAreModulesRegistered() {
        if (this.moduleRegistries.length === 0) {
            return true;
        }

        if (this.moduleRegistries.every(x => x.registrationStatus === "none")) {
            return false;
        }

        // The registration status could be "none" if an application doesn't register modules for a given registry.
        // The registration status could be "registering-deferred-registration" if all the modules of an application are registered and it's registering the deferred registrations (which is considered as being already registered).
        // The registration status could be at "ready" if there's no deferred registrations.
        return this.moduleRegistries.every(x => {
            const status = x.registrationStatus;

            return status === "none" || status === "modules-registered" || status === "registering-deferred-registration" || status === "ready";
        });
    }

    getAreModulesReady() {
        if (this.moduleRegistries.length === 0) {
            return true;
        }

        if (this.moduleRegistries.every(x => x.registrationStatus === "none")) {
            return false;
        }

        // The registration status could be "none" if an application doesn't register modules for a given registry.
        return this.moduleRegistries.every(x => {
            const status = x.registrationStatus;

            return status === "none" || status === "ready";
        });
    }

    registerModulesRegisteredListener(callback: ModuleRegistrationStatusListener) {
        const onChange: ModuleRegistrationStatusListener = () => {
            if (this.getAreModulesRegistered()) {
                this.removeModulesRegisteredListener(callback);

                callback();
            }
        };

        this.moduleRegistries.forEach(x => {
            x.registerStatusChangedListener(onChange);
        });

        this.listenerRefs.set(callback, onChange);
    }

    registerModulesReadyListener(callback: ModuleRegistrationStatusListener) {
        const onChange: ModuleRegistrationStatusListener = () => {
            if (this.getAreModulesReady()) {
                this.removeModulesRegisteredListener(callback);

                callback();
            }
        };

        this.moduleRegistries.forEach(x => {
            x.registerStatusChangedListener(onChange);
        });

        this.listenerRefs.set(callback, onChange);
    }

    #removeRegistrationStatusListener(callback: ModuleRegistrationStatusListener) {
        const onChange = this.listenerRefs.get(callback);

        if (onChange) {
            this.moduleRegistries.forEach(x => {
                x.removeStatusChangedListener(onChange);
            });

            this.listenerRefs.delete(callback);
        }
    }

    removeModulesRegisteredListener(callback: ModuleRegistrationStatusListener) {
        this.#removeRegistrationStatusListener(callback);
    }

    removeModulesReadyListener(callback: ModuleRegistrationStatusListener) {
        this.#removeRegistrationStatusListener(callback);
    }

    get listenersCount() {
        return this.listenerRefs.size;
    }

    setAsReady() {
        this.moduleRegistries.forEach(x => {
            x.setAsReady();
        });
    }
}
