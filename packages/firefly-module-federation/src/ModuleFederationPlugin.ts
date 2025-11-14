import { loadRemote as loadModuleFederationRemote } from "@module-federation/enhanced/runtime";
import { Span } from "@opentelemetry/api";
import { isNil, Plugin, RegisterModulesOptions, type Runtime } from "@squide/core";
import { ActiveSpan, addProtectedListener, endActiveSpan, FireflyPlugin, FireflyRuntime, getTracer, HoneycombTrackingUnmanagedErrorHandler, startActiveChildSpan, startChildSpan, traceError, type GetSpanFunction } from "@squide/firefly";
import { RemoteDefinition } from "./RemoteDefinition.ts";
import { RemoteModuleDeferredRegistrationFailedEvent, RemoteModuleDeferredRegistrationUpdateFailedEvent, RemoteModuleRegistrationError, RemoteModuleRegistrationFailedEvent, RemoteModuleRegistry, RemoteModuleRegistryId, RemoteModulesDeferredRegistrationCompletedEvent, RemoteModulesDeferredRegistrationCompletedEventPayload, RemoteModulesDeferredRegistrationStartedEvent, RemoteModulesDeferredRegistrationStartedEventPayload, RemoteModulesDeferredRegistrationsUpdateCompletedEvent, RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload, RemoteModulesDeferredRegistrationsUpdateStartedEvent, RemoteModulesDeferredRegistrationsUpdateStartedEventPayload, RemoteModulesRegistrationCompletedEvent, RemoteModulesRegistrationCompletedEventPayload, RemoteModulesRegistrationStartedEvent, RemoteModulesRegistrationStartedEventPayload } from "./RemoteModuleRegistry.ts";

export const ModuleFederationPluginName = "module-federation-plugin";

export class ModuleFederationPlugin extends Plugin<FireflyRuntime> implements FireflyPlugin {
    constructor(runtime: FireflyRuntime) {
        super(ModuleFederationPluginName, runtime);

        this._runtime.moduleManager.addModuleRegistry(new RemoteModuleRegistry((remoteName, moduleName) => loadModuleFederationRemote(`${remoteName}/${moduleName}`)));
    }

    registerRemoteModules<TContext = unknown>(remotes: RemoteDefinition[], options?: RegisterModulesOptions<TContext>) {
        return this._runtime.moduleManager.registerModules(remotes.map(x => ({
            definition: x,
            registryId: RemoteModuleRegistryId
        })), options);
    }

    registerHoneycombTrackingListeners(
        getBootstrappingSpan: GetSpanFunction,
        getDeferredRegistrationsUpdateSpan: GetSpanFunction,
        onUnmanagedError: HoneycombTrackingUnmanagedErrorHandler
    ) {
        let remoteModuleRegistrationSpan: Span;
        let remoteModuleDeferredRegistrationSpan: Span;
        let remoteModuleDeferredRegistrationsUpdateSpan: ActiveSpan;

        const handleUnmanagedError = (error: unknown) => {
            if (remoteModuleRegistrationSpan) {
                remoteModuleRegistrationSpan.end();
            }

            if (remoteModuleDeferredRegistrationSpan) {
                remoteModuleDeferredRegistrationSpan.end();
            }

            if (remoteModuleDeferredRegistrationsUpdateSpan) {
                remoteModuleDeferredRegistrationsUpdateSpan.instance.end();
            }

            onUnmanagedError(error);
        };

        addProtectedListener(this._runtime, RemoteModulesRegistrationStartedEvent, (payload: unknown) => {
            const bootstrappingSpan = getBootstrappingSpan();

            const attributes = {
                "app.squide.remote_count": (payload as RemoteModulesRegistrationStartedEventPayload).remoteCount
            };

            if (bootstrappingSpan) {
                bootstrappingSpan.addEvent("remote-module-registration-started", attributes);
            }

            remoteModuleRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
                return getTracer().startSpan("remote-module-registration", { ...options, attributes }, context);
            });
        }, {
            once: true,
            onError: handleUnmanagedError
        });

        addProtectedListener(this._runtime, RemoteModulesRegistrationCompletedEvent, (payload: unknown) => {
            const bootstrappingSpan = getBootstrappingSpan();

            if (bootstrappingSpan) {
                bootstrappingSpan.addEvent("remote-module-registration-completed", {
                    "app.squide.remote_count": (payload as RemoteModulesRegistrationCompletedEventPayload).remoteCount
                });
            }

            if (remoteModuleRegistrationSpan) {
                remoteModuleRegistrationSpan.end();
            }
        }, {
            once: true,
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModuleRegistrationFailedEvent, (payload: unknown) => {
            const registrationError = payload as RemoteModuleRegistrationError;

            if (remoteModuleRegistrationSpan) {
                traceError(remoteModuleRegistrationSpan, registrationError);
            }
        }, {
            onError: handleUnmanagedError
        });

        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationStartedEvent, (payload: unknown) => {
            const bootstrappingSpan = getBootstrappingSpan();

            const attributes = {
                "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationStartedEventPayload).registrationCount
            };

            if (bootstrappingSpan) {
                bootstrappingSpan.addEvent("remote-module-deferred-registration-started", attributes);
            }

            remoteModuleDeferredRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
                return getTracer().startSpan("remote-module-deferred-registration", { ...options, attributes }, context);
            });
        }, {
            once: true,
            onError: handleUnmanagedError
        });

        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
            const bootstrappingSpan = getBootstrappingSpan();

            if (bootstrappingSpan) {
                bootstrappingSpan.addEvent("remote-module-deferred-registration-completed", {
                    "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationCompletedEventPayload).registrationCount
                });
            }

            if (remoteModuleDeferredRegistrationSpan) {
                remoteModuleDeferredRegistrationSpan.end();
            }
        }, {
            once: true,
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModuleDeferredRegistrationFailedEvent, (payload: unknown) => {
            const registrationError = payload as RemoteModuleRegistrationError;

            if (remoteModuleDeferredRegistrationSpan) {
                traceError(remoteModuleDeferredRegistrationSpan, registrationError);
            }
        }, {
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationsUpdateStartedEvent, (payload: unknown) => {
            const deferredRegistrationsUpdateSpan = getDeferredRegistrationsUpdateSpan();

            const attributes = {
                "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationsUpdateStartedEventPayload).registrationCount
            };

            if (deferredRegistrationsUpdateSpan) {
                deferredRegistrationsUpdateSpan.addEvent("remote-module-deferred-registrations-update-started", attributes);
            }

            remoteModuleDeferredRegistrationsUpdateSpan = startActiveChildSpan(deferredRegistrationsUpdateSpan, (options, context) => {
                const name = "remote-module-deferred-registrations-update";

                const span = getTracer().startSpan(name, {
                    attributes,
                    ...options
                }, context);

                return {
                    name,
                    span
                };
            });
        }, {
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationsUpdateCompletedEvent, (payload: unknown) => {
            const deferredRegistrationsUpdateSpan = getDeferredRegistrationsUpdateSpan();

            if (deferredRegistrationsUpdateSpan) {
                deferredRegistrationsUpdateSpan.addEvent("remote-module-deferred-registrations-update-completed", {
                    "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload).registrationCount
                });
            }

            if (remoteModuleDeferredRegistrationsUpdateSpan) {
                endActiveSpan(remoteModuleDeferredRegistrationsUpdateSpan);
            }
        }, {
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModuleDeferredRegistrationUpdateFailedEvent, (payload: unknown) => {
            const registrationError = payload as RemoteModuleRegistrationError;

            if (remoteModuleDeferredRegistrationsUpdateSpan) {
                traceError(remoteModuleDeferredRegistrationsUpdateSpan.instance, registrationError);
            }
        }, {
            onError: handleUnmanagedError
        });

        // Cleanup the spans if the root tracking is failing.
        return (error: unknown) => {
            handleUnmanagedError(error);
        };
    }
}

export function getModuleFederationPlugin(runtime: Runtime) {
    const plugin = runtime.getPlugin(ModuleFederationPluginName);

    if (isNil(plugin)) {
        throw new Error("[squide] The getModuleFederationPlugin function is called but no ModuleFederationPlugin instance has been registered with the runtime.");
    }

    return plugin as ModuleFederationPlugin;
}
