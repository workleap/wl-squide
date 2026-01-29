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

    async registerDeferredRegistrations<TData = unknown>(data?: TData) {
        this.runtime.startDeferredRegistrationScope();

        try {
            const errors: ModuleRegistrationError[] = [];

            // Using Promise.all rather than Promise.allSettled to throw any errors that occurs.
            await Promise.all(this.moduleRegistries.map(async x => {
                const registrationErrors = await x.registerDeferredRegistrations(this.runtime, data);

                errors.push(...registrationErrors);
            }));

            return errors;
        } finally {
            this.runtime.completeDeferredRegistrationScope();
        }
    }

    async updateDeferredRegistrations<TData = unknown>(data?: TData) {
        this.runtime.startDeferredRegistrationScope({
            transactional: true
        });

        try {
            const errors: ModuleRegistrationError[] = [];

            // IMPORTANT: Currently cannot make this a concurrent operation because it cause errors
            // with the Honeycomb telemetry due to "active spans".
            for (const x of this.moduleRegistries) {
                const registrationErrors = await x.updateDeferredRegistrations(this.runtime, data);

                errors.push(...registrationErrors);
            };

            return errors;
        } finally {
            this.runtime.completeDeferredRegistrationScope();
        }
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
