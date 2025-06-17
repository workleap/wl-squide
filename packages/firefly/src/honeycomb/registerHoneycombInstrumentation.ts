import type { Span } from "@opentelemetry/api";
import {
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
import {
    DeferredRegistrationsUpdateCompletedEvent,
    DeferredRegistrationsUpdateStartedEvent,
    RemoteModuleDeferredRegistrationFailedEvent,
    RemoteModuleDeferredRegistrationUpdateFailedEvent,
    type RemoteModuleRegistrationError,
    RemoteModuleRegistrationFailedEvent,
    RemoteModulesDeferredRegistrationCompletedEvent,
    type RemoteModulesDeferredRegistrationCompletedEventPayload,
    RemoteModulesDeferredRegistrationStartedEvent,
    type RemoteModulesDeferredRegistrationStartedEventPayload,
    RemoteModulesDeferredRegistrationsUpdateCompletedEvent,
    type RemoteModulesDeferredRegistrationsUpdateCompletedEventPayload,
    RemoteModulesDeferredRegistrationsUpdateStartedEvent,
    type RemoteModulesDeferredRegistrationsUpdateStartedEventPayload,
    RemoteModulesRegistrationCompletedEvent,
    type RemoteModulesRegistrationCompletedEventPayload,
    RemoteModulesRegistrationStartedEvent,
    type RemoteModulesRegistrationStartedEventPayload
} from "@squide/module-federation";
import { ApplicationBoostrappedEvent, ModulesReadyEvent, ModulesRegisteredEvent, MswReadyEvent, ProtectedDataReadyEvent, PublicDataReadyEvent } from "../AppRouterReducer.ts";
import type { FireflyRuntime } from "../FireflyRuntime.tsx";
import { ApplicationBootstrappingStartedEvent } from "../initializeFirefly.ts";
import { ProtectedDataFetchStartedEvent } from "../useProtectedDataQueries.ts";
import { PublicDataFetchStartedEvent } from "../usePublicDataQueries.ts";
import { type ActiveSpan, createOverrideFetchRequestSpanWithActiveSpanContext, registerActiveSpanStack } from "./activeSpan.ts";
import { getTracer } from "./tracer.ts";
import { endActiveSpan, startActiveChildSpan, startChildSpan, startSpan, traceError } from "./utils.ts";

// TIPS:
// To query those traces in Honeycomb, use the following query filter: "root.name = squide-bootstrapping".

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

    // TODO: Validate if this handler should use { once: true }.
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, () => {
        if (dataFetchState === "none") {
            dataFetchState = "fetching-data";
            onDataFetchingStarted();
        }

        onPublicDataFetchStarted();
    });

    // TODO: Validate if this handler should use { once: true }.
    runtime.eventBus.addListener(PublicDataReadyEvent, () => {
        onPublicDataReady();

        if (dataFetchState === "fetching-data") {
            dataFetchState = "public-data-ready";
        } else if (dataFetchState === "protected-data-ready") {
            dataFetchState = "data-ready";
            onDataReady();
        }
    });

    // TODO: Validate if this handler should use { once: true }.
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, () => {
        if (dataFetchState === "none") {
            dataFetchState = "fetching-data";
            onDataFetchingStarted();
        }

        onProtectedDataFetchStarted();
    });

    // TODO: Validate if this handler should use { once: true }.
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
        bootstrappingSpan = startSpan((options, context) => getTracer().startSpan("squide-bootstrapping", options, context));
    }, { once: true });

    runtime.eventBus.addListener(ApplicationBoostrappedEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.end();
        }
    }, { once: true });

    runtime.eventBus.addListener(MswReadyEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("msw-ready");
        }
    }, { once: true });

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
    }, { once: true });

    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-registration-completed", {
                "app.squide.module_count": (payload as LocalModulesRegistrationCompletedEventPayload).moduleCount
            });
        }

        if (localModuleRegistrationSpan) {
            localModuleRegistrationSpan.end();
        }
    }, { once: true });

    // Can occur multiple times.
    runtime.eventBus.addListener(LocalModuleRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleRegistrationSpan) {
            traceError(localModuleRegistrationSpan, registrationError);
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
    }, { once: true });

    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("local-module-deferred-registration-completed", {
                "app.squide.registration_count": (payload as LocalModulesDeferredRegistrationCompletedEventPayload).registrationCount
            });
        }

        if (localModuleDeferredRegistrationSpan) {
            localModuleDeferredRegistrationSpan.end();
        }
    }, { once: true });

    // Can occur multiple times.
    runtime.eventBus.addListener(LocalModuleDeferredRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleDeferredRegistrationSpan) {
            traceError(localModuleRegistrationSpan, registrationError);
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
    }, { once: true });

    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("remote-module-registration-completed", {
                "app.squide.remote_count": (payload as RemoteModulesRegistrationCompletedEventPayload).remoteCount
            });
        }

        if (remoteModuleRegistrationSpan) {
            remoteModuleRegistrationSpan.end();
        }
    }, { once: true });

    // Can occur multiple times.
    runtime.eventBus.addListener(RemoteModuleRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as RemoteModuleRegistrationError;

        if (remoteModuleRegistrationSpan) {
            traceError(remoteModuleRegistrationSpan, registrationError);
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
    }, { once: true });

    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("remote-module-deferred-registration-completed", {
                "app.squide.registration_count": (payload as RemoteModulesDeferredRegistrationCompletedEventPayload).registrationCount
            });
        }

        if (remoteModuleDeferredRegistrationSpan) {
            remoteModuleDeferredRegistrationSpan.end();
        }
    }, { once: true });

    // Can occur multiple times.
    runtime.eventBus.addListener(RemoteModuleDeferredRegistrationFailedEvent, (payload: unknown) => {
        const registrationError = payload as RemoteModuleRegistrationError;

        if (remoteModuleDeferredRegistrationSpan) {
            traceError(remoteModuleDeferredRegistrationSpan, registrationError);
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
    }, { once: true });

    runtime.eventBus.addListener(ModulesReadyEvent, () => {
        if (bootstrappingSpan) {
            bootstrappingSpan.addEvent("modules-ready");
        }
    }, { once: true });

    // Can occur multiple times.
    runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => {
        deferredRegistrationsUpdateSpan = startSpan((options, context) => getTracer().startSpan("squide-deferred-registrations-update", options, context));
    });

    // Can occur multiple times.
    runtime.eventBus.addListener(DeferredRegistrationsUpdateCompletedEvent, () => {
        if (deferredRegistrationsUpdateSpan) {
            deferredRegistrationsUpdateSpan.end();
        }
    });

    // Can occur multiple times.
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

    // Can occur multiple times.
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

    // Can occur multiple times.
    runtime.eventBus.addListener(LocalModuleDeferredRegistrationUpdateFailedEvent, (payload: unknown) => {
        const registrationError = payload as ModuleRegistrationError;

        if (localModuleDeferredRegistrationsUpdateSpan) {
            traceError(localModuleDeferredRegistrationsUpdateSpan.instance, registrationError);
        }
    });

    // Can occur multiple times.
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

    // Can occur multiple times.
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

    // Can occur multiple times.
    runtime.eventBus.addListener(RemoteModuleDeferredRegistrationUpdateFailedEvent, (payload: unknown) => {
        const registrationError = payload as RemoteModuleRegistrationError;

        if (remoteModuleDeferredRegistrationsUpdateSpan) {
            traceError(remoteModuleDeferredRegistrationsUpdateSpan.instance, registrationError);
        }
    });
}

function getRegisterFetchRequestHookFunction() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return globalThis.__WLP_HONEYCOMB_REGISTER_DYNAMIC_FETCH_REQUEST_HOOK;
}

export function registerHoneycombInstrumentation(runtime: FireflyRuntime) {
    const registerFetchRequestHookFunction = getRegisterFetchRequestHookFunction();

    if (registerFetchRequestHookFunction) {
        registerActiveSpanStack();

        const activeSpanOverrideFunction = createOverrideFetchRequestSpanWithActiveSpanContext(runtime.logger);

        // Dynamically registering this request hook function to nest the HTTP requests
        // of squide bootstrapping under the appropriate Honeycomb span.
        registerFetchRequestHookFunction(activeSpanOverrideFunction);
    } else {
        runtime.logger.warning("[squide] Cannot register Honeycomb fetch request hook because \"globalThis.__WLP_HONEYCOMB_REGISTER_DYNAMIC_FETCH_REQUEST_HOOK\" is not available. Honeycomb instrumentation is still functional but in degraded mode.");
    }

    registerTrackingListeners(runtime);
}

export function canRegisterHoneycombInstrumentation() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return globalThis.__WLP_HONEYCOMB_INSTRUMENTATION_IS_REGISTERED__ === true;
}
