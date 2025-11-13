import { Runtime } from "../runtime/runtime.ts";
import { ModuleRegistrationError, ModuleRegistry, RegisterModulesOptions } from "./moduleRegistry.ts";
import { ModuleRegisterFunction } from "./registerModule.ts";

export const DeferredRegistrationsUpdateStartedEvent = "squide-deferred-registrations-update-started";
export const DeferredRegistrationsUpdateCompletedEvent = "squide-deferred-registrations-update-completed-started";

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

    async registerModules<TContext = unknown, TData = unknown>(definitions: ModuleDefinition<Runtime, TContext, TData>[], options?: RegisterModulesOptions<TContext>) {
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
        const definitionByRegistryId = Object.groupBy(definitions, x => x.registryId);

        await Promise.allSettled(Object.keys(definitionByRegistryId).map(async x => {
            const registry = this.moduleRegistries.find(y => y.id === x);

            if (registry) {
                const registrationErrors = await registry.registerModules(definitionByRegistryId[x], this.runtime, options);

                errors.push(...registrationErrors);
            } else {
                // TODO: LOG AN ERROR.
                // TODO: PUSH AN ERROR TO THE ERRORS OBJECT
            }
        }));

        return errors;
    }

    async registerDeferredRegistrations<TData = unknown>(data: TData) {
        this.runtime.startDeferredRegistrationScope();

        try {
            const errors: ModuleRegistrationError[] = [];

            await Promise.allSettled(this.moduleRegistries.map(async x => {
                const registrationErrors = await x.registerDeferredRegistrations(data, this.runtime);

                errors.push(...registrationErrors);
            }));

            return errors;
        } finally {
            this.runtime.completeDeferredRegistrationScope();
        }
    }

    async updateDeferredRegistrations<TData = unknown>(data: TData) {
        this.runtime.startDeferredRegistrationScope({
            transactional: true
        });

        try {
            const errors: ModuleRegistrationError[] = [];

            this.runtime.eventBus.dispatch(DeferredRegistrationsUpdateStartedEvent);

            await Promise.allSettled(this.moduleRegistries.map(async x => {
                const registrationErrors = await x.updateDeferredRegistrations(data, this.runtime);

                errors.push(...registrationErrors);
            }));

            this.runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);

            return errors;
        } finally {
            this.runtime.completeDeferredRegistrationScope();
        }
    }

    getAreModulesRegistered() {
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

                this.listenerRefs.delete(callback);
            });
        }
    }

    removeModulesRegisteredListener(callback: ModuleRegistrationStatusListener) {
        this.#removeRegistrationStatusListener(callback);
    }

    removeModulesReadyListener(callback: ModuleRegistrationStatusListener) {
        this.#removeRegistrationStatusListener(callback);
    }
}
