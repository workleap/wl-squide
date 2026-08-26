import { NoopLogger } from "@workleap/logging";
import { Runtime } from "../src/runtime/Runtime.ts";

// A "Runtime" that implements only what the module registries touch, so a registry test does not have to
// stand up routing or navigation. Shared by this package's registry tests: two copies drift the moment
// "Runtime" gains an abstract member, and the compiler only complains about whichever file it reaches first.
export class DummyRuntime extends Runtime {
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

    getNavigationItemsByMenu() {
        return new Map();
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
