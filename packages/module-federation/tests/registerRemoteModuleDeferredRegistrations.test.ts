import { Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { RemoteModuleDeferredRegistrationFailedEvent, RemoteModuleRegistrationError, RemoteModuleRegistry, RemoteModulesDeferredRegistrationCompletedEvent, RemoteModulesDeferredRegistrationStartedEvent } from "../src/registerRemoteModules.ts";

class DummyRuntime extends Runtime {
    registerRoute() {
        throw new Error("Method not implemented.");
    }

    registerPublicRoute() {
        throw new Error("Method not implemented.");
    }

    get routes() {
        return [];
    }

    registerNavigationItem() {
        throw new Error("Method not implemented.");
    }

    getNavigationItems() {
        return [];
    }

    startDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    completeDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    startScope(): Runtime {
        return new DummyRuntime({ loggers: [new NoopLogger()] });
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

