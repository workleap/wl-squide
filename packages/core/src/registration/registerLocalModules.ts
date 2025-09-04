import type { RootLogger } from "@workleap/logging";
import type { Runtime } from "../runtime/runtime.ts";
import { isFunction } from "../shared/assertions.ts";
import { ModuleRegistrationError, type ModuleRegistrationStatus, type ModuleRegistrationStatusChangedListener, type ModuleRegistry, type RegisterModulesOptions } from "./moduleRegistry.ts";
import { registerModule, type DeferredRegistrationFunction, type ModuleRegisterFunction } from "./registerModule.ts";

export const LocalModulesRegistrationStartedEvent = "squide-local-modules-registration-started";
export const LocalModulesRegistrationCompletedEvent = "squide-local-modules-registration-completed";
export const LocalModuleRegistrationFailedEvent = "squide-local-module-registration-failed";

export const LocalModulesDeferredRegistrationStartedEvent = "squide-local-modules-deferred-registration-started";
export const LocalModulesDeferredRegistrationCompletedEvent = "squide-local-modules-deferred-registration-completed";
export const LocalModuleDeferredRegistrationFailedEvent = "squide-local-module-deferred-registration-failed";

export const LocalModulesDeferredRegistrationsUpdateStartedEvent = "squide-local-modules-deferred-registrations-update-started";
export const LocalModulesDeferredRegistrationsUpdateCompletedEvent = "squide-local-modules-deferred-registrations-update-completed-started";
export const LocalModuleDeferredRegistrationUpdateFailedEvent = "squide-local-module-deferred-registration-update-failed";

export interface LocalModulesRegistrationStartedEventPayload {
    moduleCount: number;
}

export interface LocalModulesRegistrationCompletedEventPayload {
    moduleCount: number;
}

export interface LocalModulesDeferredRegistrationStartedEventPayload {
    registrationCount: number;
}

export interface LocalModulesDeferredRegistrationCompletedEventPayload {
    registrationCount: number;
}

export interface LocalModulesDeferredRegistrationsUpdateStartedEventPayload {
    registrationCount: number;
}

export interface LocalModulesDeferredRegistrationsUpdateCompletedEventPayload {
    registrationCount: number;
}

interface DeferredRegistration<TData = unknown> {
    index: string;
    fct: DeferredRegistrationFunction<TData>;
}

export class LocalModuleRegistry implements ModuleRegistry {
    #registrationStatus: ModuleRegistrationStatus = "none";

    readonly #deferredRegistrations: DeferredRegistration[] = [];
    readonly #statusChangedListeners = new Set<ModuleRegistrationStatusChangedListener>();

    async registerModules<TRuntime extends Runtime = Runtime<unknown, unknown>, TContext = unknown, TData = unknown>(registrationFunctions: ModuleRegisterFunction<TRuntime, TContext, TData>[], runtime: TRuntime, { context }: RegisterModulesOptions<TContext> = {}) {
        const errors: ModuleRegistrationError[] = [];

        if (this.#registrationStatus !== "none") {
            throw new Error("[squide] The registerLocalModules function can only be called once.");
        }

        if (registrationFunctions.length > 0) {
            runtime.logger.information(`[squide] Found ${registrationFunctions.length} local module${registrationFunctions.length !== 1 ? "s" : ""} to register.`);

            this.#setRegistrationStatus("registering-modules");

            runtime.eventBus.dispatch(LocalModulesRegistrationStartedEvent, {
                moduleCount: registrationFunctions.length
            } satisfies LocalModulesRegistrationStartedEventPayload);

            let completedCount = 0;

            await Promise.allSettled(registrationFunctions.map(async (x, index) => {
                const loggerScope = (runtime.logger as RootLogger).startScope(`[squide] ${index + 1}/${registrationFunctions.length} Registering local module.`);
                const runtimeScope = runtime.startScope(loggerScope);

                try {
                    const optionalDeferredRegistration = await registerModule(x as ModuleRegisterFunction<Runtime, TContext, TData>, runtimeScope, context);

                    if (isFunction(optionalDeferredRegistration)) {
                        this.#deferredRegistrations.push({
                            index: `${index + 1}/${registrationFunctions.length}`,
                            fct: optionalDeferredRegistration as DeferredRegistrationFunction
                        });
                    }

                    completedCount += 1;
                } catch (error: unknown) {
                    loggerScope
                        .withText("[squide] An error occured while registering the local module.")
                        .withError(error as Error)
                        .error();

                    loggerScope.end({
                        labelStyle: {
                            color: "red"
                        }
                    });

                    errors.push(
                        new ModuleRegistrationError("An error occured while registering a local module.", { cause: error })
                    );
                }

                loggerScope.information("[squide] Successfully registered local module.", {
                    style: {
                        color: "green"
                    }
                });

                loggerScope.end({
                    labelStyle: {
                        color: "green"
                    }
                });
            }));

            if (errors.length > 0) {
                errors.forEach(x => {
                    runtime.eventBus.dispatch(LocalModuleRegistrationFailedEvent, x);
                });
            }

            // Must be dispatched before updating the registration status to ensure bootstrapping events sequencing.
            runtime.eventBus.dispatch(LocalModulesRegistrationCompletedEvent, {
                moduleCount: completedCount
            } satisfies LocalModulesRegistrationCompletedEventPayload);

            this.#setRegistrationStatus(this.#deferredRegistrations.length > 0 ? "modules-registered" : "ready");
        } else {
            // There's no modules to register, it can be considered as ready.
            this.#setRegistrationStatus("ready");
        }

        return errors;
    }

    async registerDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
        const errors: ModuleRegistrationError[] = [];

        if (this.#registrationStatus === "ready" && this.#deferredRegistrations.length === 0) {
            // No deferred registrations were returned by the local modules, skip this phase.
            return errors;
        }

        if (this.#registrationStatus === "none" || this.#registrationStatus === "registering-modules") {
            throw new Error("[squide] The registerDeferredRegistrations function can only be called once the local modules are registered.");
        }

        if (this.#registrationStatus !== "modules-registered") {
            throw new Error("[squide] The registerDeferredRegistrations function can only be called once.");
        }

        this.#setRegistrationStatus("registering-deferred-registration");

        runtime.eventBus.dispatch(LocalModulesDeferredRegistrationStartedEvent, {
            registrationCount: this.#deferredRegistrations.length
        } satisfies LocalModulesDeferredRegistrationStartedEventPayload);

        let completedCount = 0;

        await Promise.allSettled(this.#deferredRegistrations.map(async ({ index, fct: deferredRegister }) => {
            runtime.logger
                .withText(`[squide] ${index} Registering local module deferred registrations.`)
                .withText("Data:")
                .withObject(data)
                .debug();

            try {
                await deferredRegister(data, "register");

                completedCount += 1;
            } catch (error: unknown) {
                runtime.logger
                    .withText(`[squide] ${index} An error occured while registering the deferred registrations of a local module.`)
                    .withError(error as Error)
                    .error();

                errors.push(
                    new ModuleRegistrationError("An error occured while registering the deferred registrations of a local module.", { cause: error })
                );
            }

            runtime.logger.information(`[squide] ${index} Registered local module deferred registrations.`);
        }));

        if (errors.length > 0) {
            errors.forEach(x => {
                runtime.eventBus.dispatch(LocalModuleDeferredRegistrationFailedEvent, x);
            });
        }

        // Must be dispatched before updating the registration status to ensure bootstrapping events sequencing.
        runtime.eventBus.dispatch(LocalModulesDeferredRegistrationCompletedEvent, {
            registrationCount: completedCount
        } satisfies LocalModulesDeferredRegistrationCompletedEventPayload);

        this.#setRegistrationStatus("ready");

        return errors;
    }

    async updateDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
        const errors: ModuleRegistrationError[] = [];

        if (this.#registrationStatus !== "ready") {
            throw new Error("[squide] The updateDeferredRegistrations function can only be called once the local modules are ready.");
        }

        runtime.eventBus.dispatch(LocalModulesDeferredRegistrationsUpdateStartedEvent, {
            registrationCount: this.#deferredRegistrations.length
        } satisfies LocalModulesDeferredRegistrationsUpdateStartedEventPayload);

        let completedCount = 0;

        await Promise.allSettled(this.#deferredRegistrations.map(async ({ index, fct: deferredRegister }) => {
            runtime.logger
                .withText(`[squide] ${index} Updating local module deferred registrations.`)
                .withText("Data:")
                .withObject(data)
                .debug();

            try {
                await deferredRegister(data, "update");

                completedCount += 1;
            } catch (error: unknown) {
                runtime.logger
                    .withText(`[squide] ${index} An error occured while updating the deferred registrations of a local module.`)
                    .withError(error as Error)
                    .error();

                errors.push(
                    new ModuleRegistrationError("An error occured while updating the deferred registrations a local module.", { cause: error })
                );
            }

            runtime.logger.information(`[squide] ${index} Updated local module deferred registration.`);
        }));

        if (errors.length > 0) {
            errors.forEach(x => {
                runtime.eventBus.dispatch(LocalModuleDeferredRegistrationUpdateFailedEvent, x);
            });
        }

        // Must be dispatched before updating the registration status to ensure bootstrapping events sequencing.
        runtime.eventBus.dispatch(LocalModulesDeferredRegistrationsUpdateCompletedEvent, {
            registrationCount: completedCount
        } satisfies LocalModulesDeferredRegistrationsUpdateCompletedEventPayload);

        return errors;
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

    #setRegistrationStatus(status: ModuleRegistrationStatus) {
        this.#registrationStatus = status;

        this.#statusChangedListeners.forEach(x => {
            x();
        });
    }

    get registrationStatus() {
        return this.#registrationStatus;
    }
}

let localModuleRegistry: LocalModuleRegistry | undefined;

function getLocalModuleRegistry() {
    if (!localModuleRegistry) {
        localModuleRegistry = new LocalModuleRegistry();
    }

    return localModuleRegistry;
}

// This function should only be used by tests.
export function __setLocalModuleRegistry(registry: ModuleRegistry) {
    localModuleRegistry = registry as LocalModuleRegistry;
}

// This function should only be used by tests.
export function __clearLocalModuleRegistry() {
    localModuleRegistry = undefined;
}

export function registerLocalModules<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(modules: ModuleRegisterFunction<TRuntime, TContext, TData>[], runtime: TRuntime, options?: RegisterModulesOptions<TContext>) {
    return getLocalModuleRegistry().registerModules(modules, runtime, options);
}

export function registerLocalModuleDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
    return getLocalModuleRegistry().registerDeferredRegistrations(data, runtime);
}

export function updateLocalModuleDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
    return getLocalModuleRegistry().updateDeferredRegistrations(data, runtime);
}

export function getLocalModuleRegistrationStatus() {
    return getLocalModuleRegistry().registrationStatus;
}

export function addLocalModuleRegistrationStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
    getLocalModuleRegistry().registerStatusChangedListener(callback);
}

export function removeLocalModuleRegistrationStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
    getLocalModuleRegistry().removeStatusChangedListener(callback);
}
