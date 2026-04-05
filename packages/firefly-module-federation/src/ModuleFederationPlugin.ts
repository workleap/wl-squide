import { loadRemote as loadModuleFederationRemote } from "@module-federation/enhanced/runtime";
import { Span } from "@opentelemetry/api";
import { Plugin, RegisterModulesOptions, type Runtime } from "@squide/core";
import { FireflyPlugin, FireflyRuntime } from "@squide/firefly";
import { ActiveSpan, addProtectedListener, endActiveSpan, getTracer, HoneycombTrackingUnmanagedErrorHandler, startActiveChildSpan, startChildSpan, traceError, type GetSpanFunction } from "@squide/firefly/internal";
import { RemoteDefinition } from "./RemoteDefinition.ts";
import { RemoteModuleDeferredRegistrationFailedEvent, RemoteModuleDeferredRegistrationUpdateFailedEvent, RemoteModuleRegistrationFailedEvent, RemoteModuleRegistry, RemoteModuleRegistryId, RemoteModulesDeferredRegistrationCompletedEvent, RemoteModulesDeferredRegistrationStartedEvent, RemoteModulesDeferredRegistrationsUpdateCompletedEvent, RemoteModulesDeferredRegistrationsUpdateStartedEvent, RemoteModulesRegistrationCompletedEvent, RemoteModulesRegistrationStartedEvent } from "./RemoteModuleRegistry.ts";

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

        addProtectedListener(this._runtime, RemoteModulesRegistrationStartedEvent, payload => {
            const bootstrappingSpan = getBootstrappingSpan();

            const attributes = {
                "app.squide.remote_count": payload?.remoteCount
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

        addProtectedListener(this._runtime, RemoteModulesRegistrationCompletedEvent, payload => {
            const bootstrappingSpan = getBootstrappingSpan();

            if (bootstrappingSpan) {
                bootstrappingSpan.addEvent("remote-module-registration-completed", {
                    "app.squide.remote_count": payload?.remoteCount
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
        addProtectedListener(this._runtime, RemoteModuleRegistrationFailedEvent, payload => {
            if (remoteModuleRegistrationSpan) {
                traceError(remoteModuleRegistrationSpan, payload as Error);
            }
        }, {
            onError: handleUnmanagedError
        });

        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationStartedEvent, payload => {
            const bootstrappingSpan = getBootstrappingSpan();

            const attributes = {
                "app.squide.registration_count": payload?.registrationCount
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

        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationCompletedEvent, payload => {
            const bootstrappingSpan = getBootstrappingSpan();

            if (bootstrappingSpan) {
                bootstrappingSpan.addEvent("remote-module-deferred-registration-completed", {
                    "app.squide.registration_count": payload?.registrationCount
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
        addProtectedListener(this._runtime, RemoteModuleDeferredRegistrationFailedEvent, payload => {
            if (remoteModuleDeferredRegistrationSpan) {
                traceError(remoteModuleDeferredRegistrationSpan, payload as Error);
            }
        }, {
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationsUpdateStartedEvent, payload => {
            const deferredRegistrationsUpdateSpan = getDeferredRegistrationsUpdateSpan();

            const attributes = {
                "app.squide.registration_count": payload?.registrationCount
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
        addProtectedListener(this._runtime, RemoteModulesDeferredRegistrationsUpdateCompletedEvent, payload => {
            const deferredRegistrationsUpdateSpan = getDeferredRegistrationsUpdateSpan();

            if (deferredRegistrationsUpdateSpan) {
                deferredRegistrationsUpdateSpan.addEvent("remote-module-deferred-registrations-update-completed", {
                    "app.squide.registration_count": payload?.registrationCount
                });
            }

            if (remoteModuleDeferredRegistrationsUpdateSpan) {
                endActiveSpan(remoteModuleDeferredRegistrationsUpdateSpan);
            }
        }, {
            onError: handleUnmanagedError
        });

        // Can occur multiple times.
        addProtectedListener(this._runtime, RemoteModuleDeferredRegistrationUpdateFailedEvent, payload => {
            if (remoteModuleDeferredRegistrationsUpdateSpan) {
                traceError(remoteModuleDeferredRegistrationsUpdateSpan.instance, payload as Error);
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
    const plugin = runtime.getPlugin(ModuleFederationPluginName, {
        throwOnNotFound: false
    }) as ModuleFederationPlugin;

    if (!plugin) {
        throw new Error("[squide] The getModuleFederationPlugin function is called but no ModuleFederationPlugin instance has been registered with the runtime. Did you import the initializeFirefly function from the \"@squide/firefly-module-federation\" package?");
    }

    return plugin;
}
