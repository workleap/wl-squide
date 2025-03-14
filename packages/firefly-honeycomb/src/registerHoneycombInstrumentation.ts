import type { Span } from "@opentelemetry/api";
import type { FetchRequestHookFunction } from "@opentelemetry/instrumentation-fetch";
import type { PropagateTraceHeaderCorsUrls } from "@opentelemetry/sdk-trace-web";
import {
    ApplicationBoostrappedEvent,
    ApplicationBootstrappingStartedEvent,
    DeferredRegistrationsUpdateCompletedEvent,
    DeferredRegistrationsUpdateStartedEvent,
    LocalModuleDeferredRegistrationFailedEvent,
    LocalModuleDeferredRegistrationUpdateFailedEvent,
    LocalModuleRegistrationFailedEvent,
    LocalModulesDeferredRegistrationCompletedEvent,
    LocalModulesDeferredRegistrationStartedEvent,
    LocalModulesDeferredRegistrationsUpdateCompletedEvent,
    LocalModulesDeferredRegistrationsUpdateStartedEvent,
    LocalModulesRegistrationCompletedEvent,
    LocalModulesRegistrationStartedEvent,
    ModulesReadyEvent,
    ModulesRegisteredEvent,
    MswReadyEvent,
    ProtectedDataFetchStartedEvent,
    ProtectedDataReadyEvent,
    PublicDataFetchStartedEvent,
    PublicDataReadyEvent,
    RemoteModuleDeferredRegistrationFailedEvent,
    RemoteModuleDeferredRegistrationUpdateFailedEvent,
    RemoteModuleRegistrationFailedEvent,
    RemoteModulesDeferredRegistrationCompletedEvent,
    RemoteModulesDeferredRegistrationStartedEvent,
    RemoteModulesDeferredRegistrationsUpdateCompletedEvent,
    RemoteModulesDeferredRegistrationsUpdateStartedEvent,
    RemoteModulesRegistrationCompletedEvent,
    RemoteModulesRegistrationStartedEvent,
    type FireflyRuntime,
    type LocalModulesDeferredRegistrationCompletedEventPayload,
    type LocalModulesDeferredRegistrationStartedEventPayload,
    type LocalModulesDeferredRegistrationsUpdateCompletedEventPayload,
    type LocalModulesDeferredRegistrationsUpdateStartedEventPayload,
    type LocalModulesRegistrationCompletedEventPayload,
    type LocalModulesRegistrationStartedEventPayload,
    type ModuleRegistrationError,
    type RemoteModuleRegistrationError,
    type RemoteModulesDeferredRegistrationCompletedEventPayload,
    type RemoteModulesDeferredRegistrationStartedEventPayload,
    type RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload,
    type RemoteModulesDeferredRegistrationsUpdateStartedEventPayload,
    type RemoteModulesRegistrationCompletedEventPayload,
    type RemoteModulesRegistrationStartedEventPayload
} from "@squide/firefly";
import {
    registerHoneycombInstrumentation as workleapRegisterHoneycombInstrumentation,
    type HoneycombSdkOptions,
    type RegisterHoneycombInstrumentationOptions as WorkleapRegisterHoneycombInstrumentationOptions
} from "@workleap/honeycomb";
import { createOverrideFetchRequestSpanWithActiveSpanContext, registerActiveSpanStack, type ActiveSpan } from "./activeSpan.ts";
import { getTracer } from "./tracer.ts";
import { endActiveSpan, startActiveChildSpan, startChildSpan, startSpan, traceError } from "./utils.ts";

export interface RegisterHoneycombInstrumentationOptions extends WorkleapRegisterHoneycombInstrumentationOptions {}

function getRequestHookFunction(activeSpanOverrideFunction: FetchRequestHookFunction, baseRequestHookFunction?: FetchRequestHookFunction) {
    let requestHook: FetchRequestHookFunction;

    if (baseRequestHookFunction) {
        // If "@workleap/honeycomb" already provides a function, merge both functions.
        requestHook = (...args) => {
            baseRequestHookFunction(...args);
            activeSpanOverrideFunction(...args);
        };
    } else {
        requestHook = activeSpanOverrideFunction;
    }

    return requestHook;
}

export function getInstrumentationOptions(runtime: FireflyRuntime, options: RegisterHoneycombInstrumentationOptions = {}) {
    const {
        debug,
        fetchInstrumentation,
        ...otherOptions
    } = options;

    const instrumentationOptions: WorkleapRegisterHoneycombInstrumentationOptions = {
        ...otherOptions,
        // Defaults to the runtime mode.
        debug: debug ?? runtime.mode === "development"
    };

    if (fetchInstrumentation !== false) {
        instrumentationOptions.fetchInstrumentation = defaultOptions => {
            const activeSpanOverrideFunction = createOverrideFetchRequestSpanWithActiveSpanContext(runtime.logger);
            const requestHook = getRequestHookFunction(activeSpanOverrideFunction, defaultOptions.requestHook);

            const augmentedDefaultOptions = {
                ...defaultOptions,
                requestHook
            };

            // If the consumer provides additional options for the fetch instrumentation,
            // call the consumer function with the augmented options.
            return fetchInstrumentation ? fetchInstrumentation(augmentedDefaultOptions) : augmentedDefaultOptions;
        };
    } else {
        instrumentationOptions.fetchInstrumentation = false;
    }

    return instrumentationOptions;
}

type DataFetchState = "none" | "fetching-data" | "public-data-ready" | "protected-data-ready" | "data-ready";

export function reduceDataFetchEvents(
    runtime: FireflyRuntime,
    onDataFetchingStarted: () => void,
    onDataReady: () => void,
    onPublicDataFetchStarted: () => void,
    onPublicDataReady: () => void,
    onProtectedDataFetchStarted: () => void,
    onProtectedDataReady: () => void
) {
    let dataFetchState: DataFetchState = "none";

    runtime.eventBus.addListener(PublicDataFetchStartedEvent, () => {
        if (dataFetchState === "none") {
            dataFetchState = "fetching-data";
            onDataFetchingStarted();
        }

        onPublicDataFetchStarted();
    });

    runtime.eventBus.addListener(PublicDataReadyEvent, () => {
        onPublicDataReady();

        if (dataFetchState === "fetching-data") {
            dataFetchState = "public-data-ready";
        } else if (dataFetchState === "protected-data-ready") {
            dataFetchState = "data-ready";
            onDataReady();
        }
    });

    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, () => {
        if (dataFetchState === "none") {
            dataFetchState = "fetching-data";
            onDataFetchingStarted();
        }

        onProtectedDataFetchStarted();
    });

    runtime.eventBus.addListener(ProtectedDataReadyEvent, () => {
        onProtectedDataReady();

        if (dataFetchState === "fetching-data") {
            dataFetchState = "protected-data-ready";
        } else if (dataFetchState === "public-data-ready") {
            dataFetchState = "data-ready";
            onDataReady();
        }
    });
}

function registerTrackingListeners(runtime: FireflyRuntime) {
    let bootstrappingSpan: Span;
    let localModuleRegistrationSpan: Span;
    let localModuleDeferredRegistrationSpan: Span;
    let remoteModuleRegistrationSpan: Span;
    let remoteModuleDeferredRegistrationSpan: Span;
    let dataFetchSpan: ActiveSpan;
    let deferredRegistrationsUpdateSpan: Span;
    let localModuleDeferredRegistrationsUpdateSpan: ActiveSpan;
    let remoteModuleDeferredRegistrationsUpdateSpan: ActiveSpan;

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, () => {
        bootstrappingSpan = startSpan((options, context) => getTracer().startSpan("squide-boostrapping", options, context));
    });

    runtime.eventBus.addListener(ApplicationBoostrappedEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.end();
        }
    });

    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.module_count": (payload as LocalModulesRegistrationStartedEventPayload).moduleCount
        };

        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-registration-started", attributes);
        }

        localModuleRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
            return getTracer().startSpan("local-module-registration", { ...options, attributes }, context);
        });
    });

    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-registration-completed", {
                "app.squide.module_count": (payload as LocalModulesRegistrationCompletedEventPayload).moduleCount
            });
        }

        if (localModuleRegistrationSpan) {
            localModuleRegistrationSpan.end();
        }
    });

    runtime.eventBus.addListener(LocalModuleRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleRegistrationSpan) {
            traceError(localModuleRegistrationSpan, registrationError.error);
        }
    });

    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationStartedEventPayload).registrationCount
        };

        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-deferred-registration-started", attributes);
        }

        localModuleDeferredRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
            return getTracer().startSpan("local-module-deferred-registration", { ...options, attributes }, context);
        });
    });

    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-deferred-registration-completed", {
                "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationCompletedEventPayload).registrationCount
            });
        }

        if (localModuleDeferredRegistrationSpan) {
            localModuleDeferredRegistrationSpan.end();
        }
    });

    runtime.eventBus.addListener(LocalModuleDeferredRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleDeferredRegistrationSpan) {
            traceError(localModuleRegistrationSpan, registrationError.error);
        }
    });

    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.remote_count": (payload as RemoteModulesRegistrationStartedEventPayload).remoteCount
        };

        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("remote-module-registration-started", attributes);
        }

        remoteModuleRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
            return getTracer().startSpan("remote-module-registration", { ...options, attributes }, context);
        });
    });

    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("remote-module-registration-completed", {
                "app.squide.remote_count": (payload as RemoteModulesRegistrationCompletedEventPayload).remoteCount
            });
        }

        if (remoteModuleRegistrationSpan) {
            remoteModuleRegistrationSpan.end();
        }
    });

    runtime.eventBus.addListener(RemoteModuleRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as RemoteModuleRegistrationError;

        if (remoteModuleRegistrationSpan) {
            traceError(remoteModuleRegistrationSpan, registrationError.error);
        }
    });

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, (payload: unknown) => {
        const attributes = {
            "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationStartedEventPayload).registrationCount
        };

        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("remote-module-deferred-registration-started", attributes);
        }

        remoteModuleDeferredRegistrationSpan = startChildSpan(bootstrappingSpan, (options, context) => {
            return getTracer().startSpan("remote-module-deferred-registration", { ...options, attributes }, context);
        });
    });

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("remote-module-deferred-registration-completed", {
                "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationCompletedEventPayload).registrationCount
            });
        }

        if (remoteModuleDeferredRegistrationSpan) {
            remoteModuleDeferredRegistrationSpan.end();
        }
    });

    runtime.eventBus.addListener(RemoteModuleDeferredRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as RemoteModuleRegistrationError;

        if (remoteModuleDeferredRegistrationSpan) {
            traceError(remoteModuleDeferredRegistrationSpan, registrationError.error);
        }
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

    reduceDataFetchEvents(
        runtime,
        handleFetchDataStarted,
        handleDataReady,
        handlePublicDataFetchStarted,
        handlePublicDataReady,
        handleProtectedDataFetchStarted,
        handleProtectedDataReady
    );

    runtime.eventBus.addListener(ModulesRegisteredEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("modules-registered");
        }
    });

    runtime.eventBus.addListener(ModulesReadyEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("modules-ready");
        }
    });

    runtime.eventBus.addListener(MswReadyEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("msw-ready");
        }
    });

    runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => {
        deferredRegistrationsUpdateSpan = startSpan((options, context) => getTracer().startSpan("squide-deferred-registrations-update", options, context));
    });

    runtime.eventBus.addListener(DeferredRegistrationsUpdateCompletedEvent, () => {
        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.end();
        }
    });

    runtime.eventBus.addListener(LocalModulesDeferredRegistrationsUpdateStartedEvent, (payload: unknown) => {
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
    });

    runtime.eventBus.addListener(LocalModulesDeferredRegistrationsUpdateCompletedEvent, (payload: unknown) => {
        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.addEvent("local-module-deferred-registrations-update-completed", {
                "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationsUpdateCompletedEventPayload).registrationCount
            });
        }

        if (localModuleDeferredRegistrationsUpdateSpan) {
            endActiveSpan(localModuleDeferredRegistrationsUpdateSpan);
        }
    });

    runtime.eventBus.addListener(LocalModuleDeferredRegistrationUpdateFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleDeferredRegistrationsUpdateSpan) {
            traceError(localModuleDeferredRegistrationsUpdateSpan.instance, registrationError.error);
        }
    });

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationsUpdateStartedEvent, (payload: unknown) => {
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
    });

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationsUpdateCompletedEvent, (payload: unknown) => {
        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.addEvent("remote-module-deferred-registrations-update-completed", {
                "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload).registrationCount
            });
        }

        if (remoteModuleDeferredRegistrationsUpdateSpan) {
            endActiveSpan(remoteModuleDeferredRegistrationsUpdateSpan);
        }
    });

    runtime.eventBus.addListener(RemoteModuleDeferredRegistrationUpdateFailedEvent, (payload: unknown) => {
        const registrationError = payload as RemoteModuleRegistrationError;

        if (remoteModuleDeferredRegistrationsUpdateSpan) {
            traceError(remoteModuleDeferredRegistrationsUpdateSpan.instance, registrationError.error);
        }
    });
}

export function registerHoneycombInstrumentation(runtime: FireflyRuntime, serviceName: NonNullable<HoneycombSdkOptions["serviceName"]>, apiServiceUrls: PropagateTraceHeaderCorsUrls, options?: RegisterHoneycombInstrumentationOptions) {
    const augmentedOptions = getInstrumentationOptions(runtime, options);

    workleapRegisterHoneycombInstrumentation(serviceName, apiServiceUrls, augmentedOptions);

    registerTrackingListeners(runtime);
    registerActiveSpanStack();
}
