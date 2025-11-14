import type { Span } from "@opentelemetry/api";
import {
    type AddListenerOptions,
    type EventCallbackFunction,
    type EventName,
    LocalModuleDeferredRegistrationFailedEvent,
    LocalModuleDeferredRegistrationUpdateFailedEvent,
    LocalModuleRegistrationFailedEvent,
    LocalModulesDeferredRegistrationCompletedEvent,
    type LocalModulesDeferredRegistrationCompletedEventPayload,
    LocalModulesDeferredRegistrationStartedEvent,
    type LocalModulesDeferredRegistrationStartedEventPayload,
    LocalModulesDeferredRegistrationsUpdateCompletedEvent,
    type LocalModulesDeferredRegistrationsUpdateCompletedEventPayload,
    LocalModulesDeferredRegistrationsUpdateStartedEvent,
    type LocalModulesDeferredRegistrationsUpdateStartedEventPayload,
    LocalModulesRegistrationCompletedEvent,
    type LocalModulesRegistrationCompletedEventPayload,
    LocalModulesRegistrationStartedEvent,
    type LocalModulesRegistrationStartedEventPayload,
    type ModuleRegistrationError
} from "@squide/core";
import { ApplicationBoostrappedEvent, type AppRouterWaitState, ModulesReadyEvent, ModulesRegisteredEvent, MswReadyEvent, ProtectedDataReadyEvent, PublicDataReadyEvent } from "../AppRouterReducer.ts";
import { FireflyPlugin } from "../FireflyPlugin.ts";
import type { FireflyRuntime } from "../FireflyRuntime.tsx";
import { ApplicationBootstrappingStartedEvent } from "../initializeFirefly.ts";
import { ProtectedDataFetchFailedEvent, ProtectedDataFetchStartedEvent } from "../useProtectedDataQueries.ts";
import { PublicDataFetchFailedEvent, PublicDataFetchStartedEvent } from "../usePublicDataQueries.ts";
import { DeferredRegistrationsUpdateCompletedEvent, DeferredRegistrationsUpdateStartedEvent } from "../useUpdateDeferredRegistrations.ts";
import { type ActiveSpan, createOverrideFetchRequestSpanWithActiveSpanContext, registerActiveSpanStack } from "./activeSpan.ts";
import { getTracer } from "./tracer.ts";
import { endActiveSpan, startActiveChildSpan, startChildSpan, startSpan, traceError } from "./utils.ts";

// TIPS:
// To query those traces in Honeycomb, use the following query filter: "root.name = squide-bootstrapping".

export interface AddProtectedListenerOptions extends AddListenerOptions {
    onError?: (error: unknown) => void;
}

export function addProtectedListener(runtime: FireflyRuntime, eventName: EventName, callback: EventCallbackFunction, options?: AddProtectedListenerOptions) {
    const protectedCallback = (...args: unknown[]) => {
        try {
            callback(...args);
        } catch (error: unknown) {
            runtime.logger
                .withText(`[squide] An unmanaged error occurred while handling event "${eventName.toString()}" for Honeycomb instrumentation:`)
                .withError(error as Error)
                .error();
        }
    };

    runtime.eventBus.addListener(eventName, protectedCallback, options);
}

export type GetSpanFunction = () => Span;
export type HoneycombTrackingUnmanagedErrorHandler = (error: unknown) => void;

type DataFetchState = "none" | "fetching-data" | "public-data-ready" | "protected-data-ready" | "data-ready" | "data-fetch-failed";

export function reduceDataFetchEvents(
    runtime: FireflyRuntime,
    onDataFetchStarted: () => void,
    onDataReady: () => void,
    onPublicDataFetchStarted: () => void,
    onPublicDataReady: () => void,
    onProtectedDataFetchStarted: () => void,
    onProtectedDataReady: () => void,
    onDataFetchFailed: (queriesErrors: Error[]) => void,
    onUnmanagedError: (error: unknown) => void
) {
    let dataFetchState: DataFetchState = "none";

    addProtectedListener(runtime, PublicDataFetchStartedEvent, () => {
        if (dataFetchState === "none") {
            dataFetchState = "fetching-data";
            onDataFetchStarted();
        }

        onPublicDataFetchStarted();
    }, {
        once: true,
        onError: onUnmanagedError
    });

    addProtectedListener(runtime, PublicDataReadyEvent, payload => {
        onPublicDataReady();

        if (dataFetchState === "fetching-data") {
            if (payload && !(payload as AppRouterWaitState).waitForProtectedData) {
                dataFetchState = "data-ready";
                onDataReady();
            } else {
                dataFetchState = "public-data-ready";
            }
        } else if (dataFetchState === "protected-data-ready") {
            dataFetchState = "data-ready";
            onDataReady();
        }
    }, {
        once: true,
        onError: onUnmanagedError
    });

    addProtectedListener(runtime, ProtectedDataFetchStartedEvent, () => {
        if (dataFetchState === "none") {
            dataFetchState = "fetching-data";
            onDataFetchStarted();
        }

        onProtectedDataFetchStarted();
    }, {
        once: true,
        onError: onUnmanagedError
    });

    addProtectedListener(runtime, ProtectedDataReadyEvent, payload => {
        onProtectedDataReady();

        if (dataFetchState === "fetching-data") {
            if (payload && !(payload as AppRouterWaitState).waitForPublicData) {
                dataFetchState = "data-ready";
                onDataReady();
            } else {
                dataFetchState = "protected-data-ready";
            }
        } else if (dataFetchState === "public-data-ready") {
            dataFetchState = "data-ready";
            onDataReady();
        }
    }, {
        once: true,
        onError: onUnmanagedError
    });

    const handleDataFetchFailed = (payload: unknown) => {
        if (dataFetchState !== "data-fetch-failed") {
            dataFetchState = "data-fetch-failed";

            onDataFetchFailed(payload as Error[]);
        }
    };

    addProtectedListener(runtime, PublicDataFetchFailedEvent, handleDataFetchFailed, {
        once: true,
        onError: onUnmanagedError
    });

    addProtectedListener(runtime, ProtectedDataFetchFailedEvent, handleDataFetchFailed, {
        once: true,
        onError: onUnmanagedError
    });
}

function registerTrackingListeners(runtime: FireflyRuntime) {
    let bootstrappingSpan: Span;
    let bootstrappingSpanHasEnded: boolean = false;
    let localModuleRegistrationSpan: Span;
    let localModuleDeferredRegistrationSpan: Span;
    let dataFetchSpan: ActiveSpan;
    let deferredRegistrationsUpdateSpan: Span;
    let localModuleDeferredRegistrationsUpdateSpan: ActiveSpan;

    const pluginsUnmanagedErrorHandlers: HoneycombTrackingUnmanagedErrorHandler[] = [];

    const handleUnmanagedError = (error: unknown) => {
        if (bootstrappingSpan && !bootstrappingSpanHasEnded) {
            traceError(bootstrappingSpan, error as Error);

            bootstrappingSpan.end();
            bootstrappingSpanHasEnded = true;
        }

        if (localModuleRegistrationSpan) {
            localModuleRegistrationSpan.end();
        }

        if (localModuleDeferredRegistrationSpan) {
            localModuleDeferredRegistrationSpan.end();
        }

        // if (remoteModuleRegistrationSpan) {
        //     remoteModuleRegistrationSpan.end();
        // }

        // if (remoteModuleDeferredRegistrationSpan) {
        //     remoteModuleDeferredRegistrationSpan.end();
        // }

        if (dataFetchSpan) {
            dataFetchSpan.instance.end();
        }

        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.end();
        }

        if (localModuleDeferredRegistrationsUpdateSpan) {
            localModuleDeferredRegistrationsUpdateSpan.instance.end();
        }

        // if (remoteModuleDeferredRegistrationsUpdateSpan) {
        //     remoteModuleDeferredRegistrationsUpdateSpan.instance.end();
        // }
    };

    addProtectedListener(runtime, ApplicationBootstrappingStartedEvent, () => {
        bootstrappingSpan = startSpan((options, context) => getTracer().startSpan("squide-bootstrapping", options, context));
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, ApplicationBoostrappedEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.end();
            bootstrappingSpanHasEnded = true;
        }
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, MswReadyEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("msw-ready");
        }
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, LocalModulesRegistrationStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.module_count": (payload as LocalModulesRegistrationStartedEventPayload).moduleCount
        };

        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-registration-started", attributes);
        }

        localModuleRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
            return getTracer().startSpan("local-module-registration", { ...options, attributes }, context);
        });
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, LocalModulesRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-registration-completed", {
                "app.squide.module_count": (payload as LocalModulesRegistrationCompletedEventPayload).moduleCount
            });
        }

        if (localModuleRegistrationSpan) {
            localModuleRegistrationSpan.end();
        }
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    // Can occur multiple times.
    addProtectedListener(runtime, LocalModuleRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleRegistrationSpan) {
            traceError(localModuleRegistrationSpan, registrationError);
        }
    }, {
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, LocalModulesDeferredRegistrationStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationStartedEventPayload).registrationCount
        };

        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-deferred-registration-started", attributes);
        }

        localModuleDeferredRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
            return getTracer().startSpan("local-module-deferred-registration", { ...options, attributes }, context);
        });
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, LocalModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-deferred-registration-completed", {
                "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationCompletedEventPayload).registrationCount
            });
        }

        if (localModuleDeferredRegistrationSpan) {
            localModuleDeferredRegistrationSpan.end();
        }
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    // Can occur multiple times.
    addProtectedListener(runtime, LocalModuleDeferredRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleDeferredRegistrationSpan) {
            traceError(localModuleRegistrationSpan, registrationError);
        }
    }, {
        onError: handleUnmanagedError
    });

    const handleFetchDataStarted = () => {
        dataFetchSpan = startActiveChildSpan(bootstrappingSpan, (options, context) => {
            const name = "data-fetch";
            const span = getTracer().startSpan(name, options, context);

            return {
                name,
                span
            };
        });
    };

    const handleDataReady = () => {
        if (dataFetchSpan) {
            endActiveSpan(dataFetchSpan);
        }
    };

    const handlePublicDataFetchStarted = () => {
        if (dataFetchSpan) {
            dataFetchSpan.instance.addEvent("public-data-fetch-started");
        }
    };

    const handlePublicDataReady = () => {
        if (dataFetchSpan) {
            dataFetchSpan.instance.addEvent("public-data-ready");
        }
    };

    const handleProtectedDataFetchStarted = () => {
        if (dataFetchSpan) {
            dataFetchSpan.instance.addEvent("protected-data-fetch-started");
        }
    };

    const handleProtectedDataReady = () => {
        if (dataFetchSpan) {
            dataFetchSpan.instance.addEvent("protected-data-ready");
        }
    };

    const handleDataFetchFailed = (queriesErrors: Error[]) => {
        if (dataFetchSpan) {
            queriesErrors.forEach(x => {
                traceError(dataFetchSpan.instance, x);
            });

            endActiveSpan(dataFetchSpan);

            // Global data fetch errors are unmanaged, which mean the host application bootstrapping flow
            // will be aborted and a react-router error boundary will be rendered.
            if (bootstrappingSpan) {
                bootstrappingSpan.end();
                bootstrappingSpanHasEnded = true;
            }
        }
    };

    reduceDataFetchEvents(
        runtime,
        handleFetchDataStarted,
        handleDataReady,
        handlePublicDataFetchStarted,
        handlePublicDataReady,
        handleProtectedDataFetchStarted,
        handleProtectedDataReady,
        handleDataFetchFailed,
        handleUnmanagedError
    );

    addProtectedListener(runtime, ModulesRegisteredEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("modules-registered");
        }
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    addProtectedListener(runtime, ModulesReadyEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("modules-ready");
        }
    }, {
        once: true,
        onError: handleUnmanagedError
    });

    // Can occur multiple times.
    addProtectedListener(runtime, DeferredRegistrationsUpdateStartedEvent, () => {
        deferredRegistrationsUpdateSpan = startSpan((options, context) => getTracer().startSpan("squide-deferred-registrations-update", options, context));
    }, {
        onError: handleUnmanagedError
    });

    // Can occur multiple times.
    addProtectedListener(runtime, DeferredRegistrationsUpdateCompletedEvent, () => {
        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.end();
        }
    }, {
        onError: handleUnmanagedError
    });

    // Can occur multiple times.
    addProtectedListener(runtime, LocalModulesDeferredRegistrationsUpdateStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationsUpdateStartedEventPayload).registrationCount
        };

        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.addEvent("local-module-deferred-registrations-update-started", attributes);
        }

        localModuleDeferredRegistrationsUpdateSpan = startActiveChildSpan(deferredRegistrationsUpdateSpan, (options, context) => {
            const name = "local-module-deferred-registrations-update";

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
    addProtectedListener(runtime, LocalModulesDeferredRegistrationsUpdateCompletedEvent, (payload: unknown) => {
        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.addEvent("local-module-deferred-registrations-update-completed", {
                "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationsUpdateCompletedEventPayload).registrationCount
            });
        }

        if (localModuleDeferredRegistrationsUpdateSpan) {
            endActiveSpan(localModuleDeferredRegistrationsUpdateSpan);
        }
    }, {
        onError: handleUnmanagedError
    });

    // Can occur multiple times.
    addProtectedListener(runtime, LocalModuleDeferredRegistrationUpdateFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleDeferredRegistrationsUpdateSpan) {
            traceError(localModuleDeferredRegistrationsUpdateSpan.instance, registrationError);
        }
    }, {
        onError: handleUnmanagedError
    });

    const getBootstrappingSpan: GetSpanFunction = () => bootstrappingSpan;
    const getDeferredRegistrationsUpdateSpan: GetSpanFunction = () => deferredRegistrationsUpdateSpan;

    const handlePluginUnmanagedError: HoneycombTrackingUnmanagedErrorHandler = (error: unknown) => {
        handleUnmanagedError(error);
    };

    // Register plugins specific handlers for Honeycomb telemetry.
    runtime.plugins.forEach(x => {
        const plugin = x as FireflyPlugin;

        if (plugin.registerHoneycombTrackingListeners) {
            const unmanagedErrorHandler = plugin.registerHoneycombTrackingListeners(
                getBootstrappingSpan,
                getDeferredRegistrationsUpdateSpan,
                handlePluginUnmanagedError
            );

            pluginsUnmanagedErrorHandlers.push(unmanagedErrorHandler);
        }
    });
}

export function registerHoneycombInstrumentation(runtime: FireflyRuntime) {
    try {
        registerActiveSpanStack();

        // Dynamically registering this request hook function to nest the HTTP requests
        // of squide bootstrapping under the appropriate Honeycomb span.
        runtime.honeycombInstrumentationClient?.registerFetchRequestHook(createOverrideFetchRequestSpanWithActiveSpanContext(runtime.logger));

        registerTrackingListeners(runtime);

        runtime.logger.information("[squide] Honeycomb instrumentation is registered.");
    } catch (error: unknown) {
        runtime.logger
            .withText("[squide] An error occurred while registering Honeycomb instrumentation:")
            .withError(error as Error)
            .error();
    }
}
