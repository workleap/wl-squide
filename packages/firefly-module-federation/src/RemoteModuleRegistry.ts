import { isFunction, isNil, ModuleDefinition, ModuleRegistrationError, registerModule, type DeferredRegistrationFunction, type ModuleRegistrationStatus, type ModuleRegistrationStatusChangedListener, type ModuleRegistry, type RegisterModulesOptions, type Runtime } from "@squide/core";
import type { Logger, RootLogger } from "@workleap/logging";
import type { RemoteDefinition } from "./RemoteDefinition.ts";

export const RemoteModuleRegistryId = "remote";

export const RemoteModulesRegistrationStartedEvent = "squide-remote-modules-registration-started";
export const RemoteModulesRegistrationCompletedEvent = "squide-remote-modules-registration-completed";
export const RemoteModuleRegistrationFailedEvent = "squide-remote-module-registration-failed";

export const RemoteModulesDeferredRegistrationStartedEvent = "squide-remote-modules-deferred-registration-started";
export const RemoteModulesDeferredRegistrationCompletedEvent = "squide-remote-modules-deferred-registration-completed";
export const RemoteModuleDeferredRegistrationFailedEvent = "squide-some-remote-module-deferred-registration-failed";

export const RemoteModulesDeferredRegistrationsUpdateStartedEvent = "squide-remote-modules-deferred-registrations-update-started";
export const RemoteModulesDeferredRegistrationsUpdateCompletedEvent = "squide-remote-modules-deferred-registrations-update-completed-started";
export const RemoteModuleDeferredRegistrationUpdateFailedEvent = "squide-remote-module-deferred-registration-update-failed";

export interface RemoteModulesRegistrationStartedEventPayload {
    remoteCount: number;
}

export interface RemoteModulesRegistrationCompletedEventPayload {
    remoteCount: number;
}

export interface RemoteModulesDeferredRegistrationStartedEventPayload {
    registrationCount: number;
}

export interface RemoteModulesDeferredRegistrationCompletedEventPayload {
    registrationCount: number;
}

export interface RemoteModulesDeferredRegistrationsUpdateStartedEventPayload {
    registrationCount: number;
}

export interface RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload {
    registrationCount: number;
}

const RemoteRegisterModuleName = "register";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoadRemoteFunction = (remoteName: string, moduleName: string) => Promise<any>;

interface DeferredRegistration<TRuntime extends Runtime = Runtime, TData = unknown> {
    remoteName: string;
    index: string;
    fct: DeferredRegistrationFunction<TRuntime, TData>;
}

export class RemoteModuleRegistrationError extends ModuleRegistrationError {
    readonly #remoteName: string;
    readonly #moduleName: string;

    constructor(message: string, remoteName: string, moduleName: string, options?: ErrorOptions) {
        super(message, options);

        this.#remoteName = remoteName;
        this.#moduleName = moduleName;
    }

    get remoteName() {
        return this.#remoteName;
    }

    get moduleName() {
        return this.#moduleName;
    }
}

export class RemoteModuleRegistry implements ModuleRegistry {
    #registrationStatus: ModuleRegistrationStatus = "none";

    readonly #deferredRegistrations: DeferredRegistration[] = [];
    readonly #loadRemote: LoadRemoteFunction;
    readonly #statusChangedListeners = new Set<ModuleRegistrationStatusChangedListener>();

    constructor(loadRemote: LoadRemoteFunction) {
        this.#loadRemote = loadRemote;
    }

    get id() {
        return RemoteModuleRegistryId;
    }

    #logSharedScope(logger: Logger) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (__webpack_share_scopes__) {
            logger.debug(
                "[squide] Module Federation shared scope is available:",
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                __webpack_share_scopes__.default
            );
        }
    }

    async registerModules<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(remotes: RemoteDefinition[], runtime: TRuntime, { context }: RegisterModulesOptions<TContext> = {}) {
        const errors: RemoteModuleRegistrationError[] = [];

        if (this.#registrationStatus !== "none") {
            throw new Error("[squide] The registerRemoteModules function can only be called once.");
        }

        if (remotes.length > 0) {
            runtime.logger.information(`[squide] Found ${remotes.length} remote module${remotes.length !== 1 ? "s" : ""} to register.`);

            this.#setRegistrationStatus("registering-modules");

            runtime.eventBus.dispatch(RemoteModulesRegistrationStartedEvent, {
                remoteCount: remotes.length
            } satisfies RemoteModulesRegistrationStartedEventPayload);

            let completedCount = 0;

            await Promise.allSettled(remotes.map(async (x, index) => {
                const remoteName = x.name;
                const loggerScope = (runtime.logger as RootLogger).startScope(`[squide] ${index + 1}/${remotes.length} Loading module "${RemoteRegisterModuleName}" of remote "${remoteName}".`);
                const runtimeScope = runtime.startScope(loggerScope);

                try {
                    const module = await this.#loadRemote(remoteName, RemoteRegisterModuleName);

                    if (isNil(module.register)) {
                        throw new Error(`[squide] A "register" function is not available for module "${RemoteRegisterModuleName}" of remote "${remoteName}". Make sure your remote "./register.[js,jsx,ts.tsx]" file export a function named "register".`);
                    }

                    loggerScope.debug("[squide] Registering module...");

                    const optionalDeferredRegistration = await registerModule<TRuntime, TContext, TData>(module.register, runtimeScope as TRuntime, context);

                    if (isFunction(optionalDeferredRegistration)) {
                        this.#deferredRegistrations.push({
                            remoteName: x.name,
                            index: `${index + 1}/${remotes.length}`,
                            fct: optionalDeferredRegistration as DeferredRegistrationFunction
                        });
                    }

                    completedCount += 1;

                    loggerScope.information("[squide] Successfully registered remote module.", {
                        style: {
                            color: "green"
                        }
                    });

                    loggerScope.end({
                        labelStyle: {
                            color: "green"
                        }
                    });
                } catch (error: unknown) {
                    loggerScope
                        .withText("[squide] An error occured while registering the remote module.")
                        .withError(error as Error)
                        .error();

                    loggerScope.end({
                        labelStyle: {
                            color: "red"
                        }
                    });

                    errors.push(
                        new RemoteModuleRegistrationError(
                            `An error occured while registering module "${RemoteRegisterModuleName}" of remote "${remoteName}".`,
                            remoteName,
                            RemoteRegisterModuleName,
                            { cause: error }
                        )
                    );
                }
            }));

            if (errors.length > 0) {
                errors.forEach(x => {
                    runtime.eventBus.dispatch(RemoteModuleRegistrationFailedEvent, x);
                });
            }

            // Must be dispatched before updating the registration status to ensure bootstrapping events sequencing.
            runtime.eventBus.dispatch(RemoteModulesRegistrationCompletedEvent, {
                remoteCount: completedCount
            } satisfies RemoteModulesRegistrationCompletedEventPayload);

            this.#setRegistrationStatus(this.#deferredRegistrations.length > 0 ? "modules-registered" : "ready");

            // After introducting the "setRegistrationStatus" method, TypeScript seems to think that the only possible
            // values for registrationStatus is "none" and now complains about the lack of overlapping between "none" and "ready".
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (this.#registrationStatus === "ready") {
                this.#logSharedScope(runtime.logger);
            }
        } else {
            // There's no modules to register, it can be considered as ready.
            this.#setRegistrationStatus("ready");
        }

        return errors;
    }

    async registerDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
        const errors: RemoteModuleRegistrationError[] = [];

        if (this.#registrationStatus === "ready" && this.#deferredRegistrations.length === 0) {
            // No deferred registrations were returned by the remote modules, skip this phase.
            return errors;
        }

        if (this.#registrationStatus === "none" || this.#registrationStatus === "registering-modules") {
            throw new Error("[squide] The registerDeferredRegistrations function can only be called once the remote modules are registered.");
        }

        if (this.#registrationStatus !== "modules-registered") {
            throw new Error("[squide] The registerDeferredRegistrations function can only be called once.");
        }

        this.#setRegistrationStatus("registering-deferred-registration");

        runtime.eventBus.dispatch(RemoteModulesDeferredRegistrationStartedEvent, {
            registrationCount: this.#deferredRegistrations.length
        } satisfies RemoteModulesDeferredRegistrationStartedEventPayload);

        let completedCount = 0;

        await Promise.allSettled(this.#deferredRegistrations.map(async ({ remoteName, index, fct: deferredRegister }) => {
            const loggerScope = (runtime.logger as RootLogger).startScope(`[squide] ${index} Registering the deferred registrations for module "${RemoteRegisterModuleName}" of remote "${remoteName}".`);
            const runtimeScope = runtime.startScope(loggerScope);

            loggerScope
                .withText("Data:")
                .withObject(data)
                .debug();

            try {
                await deferredRegister(runtimeScope, data, "register");

                completedCount += 1;
            } catch (error: unknown) {
                loggerScope
                    .withText("[squide] An error occured while registering the deferred registrations.")
                    .withError(error as Error)
                    .error();

                loggerScope.end({
                    labelStyle: {
                        color: "red"
                    }
                });

                errors.push(
                    new RemoteModuleRegistrationError(
                        `An error occured while registering the deferred registrations for module "${RemoteRegisterModuleName}" of remote "${remoteName}".`,
                        remoteName,
                        RemoteRegisterModuleName,
                        { cause: error }
                    )
                );
            }

            loggerScope.information("[squide] Successfully registered deferred registrations.", {
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
                runtime.eventBus.dispatch(RemoteModuleDeferredRegistrationFailedEvent, x);
            });
        }

        // Must be dispatched before updating the registration status to ensure bootstrapping events sequencing.
        runtime.eventBus.dispatch(RemoteModulesDeferredRegistrationCompletedEvent, {
            registrationCount: completedCount
        } satisfies RemoteModulesDeferredRegistrationCompletedEventPayload);

        this.#setRegistrationStatus("ready");
        this.#logSharedScope(runtime.logger);

        return errors;
    }

    async updateDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
        const errors: RemoteModuleRegistrationError[] = [];

        if (this.#registrationStatus !== "ready") {
            throw new Error("[squide] The updateDeferredRegistrations function can only be called once the remote modules are ready.");
        }

        runtime.eventBus.dispatch(RemoteModulesDeferredRegistrationsUpdateStartedEvent, {
            registrationCount: this.#deferredRegistrations.length
        } satisfies RemoteModulesDeferredRegistrationsUpdateStartedEventPayload);

        let completedCount = 0;

        await Promise.allSettled(this.#deferredRegistrations.map(async ({ remoteName, index, fct: deferredRegister }) => {
            const loggerScope = (runtime.logger as RootLogger).startScope(`[squide] ${index} Updating the deferred registrations for module "${RemoteRegisterModuleName}" of remote "${remoteName}".`);
            const runtimeScope = runtime.startScope(loggerScope);

            loggerScope
                .withText("Data:")
                .withObject(data)
                .debug();

            try {
                await deferredRegister(runtimeScope, data, "update");

                completedCount += 1;
            } catch (error: unknown) {
                loggerScope
                    .withText("[squide] An error occured while updating the deferred registrations.")
                    .withError(error as Error)
                    .error();

                loggerScope.end({
                    labelStyle: {
                        color: "red"
                    }
                });

                errors.push(
                    new RemoteModuleRegistrationError(
                        `An error occured while updating the deferred registrations for module "${RemoteRegisterModuleName}" of remote "${remoteName}".`,
                        remoteName,
                        RemoteRegisterModuleName,
                        { cause: error }
                    )
                );
            }

            loggerScope.information("[squide] Successfully updated the deferred registrations.", {
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
                runtime.eventBus.dispatch(RemoteModuleDeferredRegistrationUpdateFailedEvent, x);
            });
        }

        runtime.eventBus.dispatch(RemoteModulesDeferredRegistrationsUpdateCompletedEvent, {
            registrationCount: completedCount
        } satisfies RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload);

        return errors;
    }

    registerStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
        this.#statusChangedListeners.add(callback);
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

export function toRemoteModuleDefinitions(remotes: (RemoteDefinition | undefined)[]): ModuleDefinition[] {
    return remotes
        .filter((x): x is RemoteDefinition => Boolean(x))
        .map(x => ({
            definition: x,
            registryId: RemoteModuleRegistryId
        }));
}
