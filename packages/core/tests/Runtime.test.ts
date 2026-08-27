import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import type { DeferredRegistrationOperation } from "../src/registration/registerModule.ts";
import { Runtime, RuntimeScope, type StartDeferredRegistrationScopeOptions } from "../src/runtime/Runtime.ts";

// Notifying the started listeners is the responsibility of the concrete runtimes, therefore the dummy
// runtime mirrors what "ReactRouterRuntime" does.
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

    getNavigationItemsByMenu() {
        return new Map();
    }

    startDeferredRegistrationScope(options: StartDeferredRegistrationScopeOptions = {}) {
        const {
            transactional = false,
            operation = transactional ? "update" : "register"
        } = options;

        this._notifyDeferredRegistrationScopeStarted(operation);
    }

    completeDeferredRegistrationScope(): void {
    }

    startScope(): Runtime {
        return new DummyRuntime({ loggers: [new NoopLogger()] });
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

class DummyRuntimeScope extends RuntimeScope {}

function createRuntime() {
    return new DummyRuntime({ loggers: [new NoopLogger()] });
}

describe.concurrent("deferred registration scope started listeners", () => {
    test.concurrent("a registered listener is notified when a scope starts", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.startDeferredRegistrationScope();

        expect(listener).toHaveBeenCalledExactlyOnceWith("register");
    });

    test.concurrent("the operation is forwarded to the listener", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.startDeferredRegistrationScope({ operation: "update" });

        expect(listener).toHaveBeenCalledExactlyOnceWith("update");
    });

    test.concurrent("when no operation is provided, the operation is derived from the transactional option", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.startDeferredRegistrationScope({ transactional: true });

        expect(listener).toHaveBeenCalledExactlyOnceWith("update");
    });

    test.concurrent("every registered listener is notified", ({ expect }) => {
        const runtime = createRuntime();
        const listener1 = vi.fn();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener1);
        runtime.registerDeferredRegistrationScopeStartedListener(listener2);
        runtime.registerDeferredRegistrationScopeStartedListener(listener3);

        runtime.startDeferredRegistrationScope();

        expect(listener1).toHaveBeenCalledOnce();
        expect(listener2).toHaveBeenCalledOnce();
        expect(listener3).toHaveBeenCalledOnce();
    });

    test.concurrent("the listeners are notified in registration order", ({ expect }) => {
        const runtime = createRuntime();
        const calls: string[] = [];

        runtime.registerDeferredRegistrationScopeStartedListener(() => calls.push("first"));
        runtime.registerDeferredRegistrationScopeStartedListener(() => calls.push("second"));
        runtime.registerDeferredRegistrationScopeStartedListener(() => calls.push("third"));

        runtime.startDeferredRegistrationScope();

        expect(calls).toEqual(["first", "second", "third"]);
    });

    test.concurrent("a listener is notified for every scope that starts", ({ expect }) => {
        const runtime = createRuntime();
        const operations: DeferredRegistrationOperation[] = [];

        runtime.registerDeferredRegistrationScopeStartedListener(x => operations.push(x));

        runtime.startDeferredRegistrationScope({ operation: "register" });
        runtime.startDeferredRegistrationScope({ operation: "update" });
        runtime.startDeferredRegistrationScope({ operation: "update" });

        expect(operations).toEqual(["register", "update", "update"]);
    });

    test.concurrent("a listener registered twice is only notified once", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.registerDeferredRegistrationScopeStartedListener(listener);

        runtime.startDeferredRegistrationScope();

        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("a removed listener is not notified", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.removeDeferredRegistrationScopeStartedListener(listener);

        runtime.startDeferredRegistrationScope();

        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("the returned disposer removes the listener", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        const dispose = runtime.registerDeferredRegistrationScopeStartedListener(listener);

        runtime.startDeferredRegistrationScope();

        dispose();

        runtime.startDeferredRegistrationScope();

        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("removing an unknown listener doesn't throw", ({ expect }) => {
        const runtime = createRuntime();

        expect(() => runtime.removeDeferredRegistrationScopeStartedListener(vi.fn())).not.toThrow();
    });

    test.concurrent("when a listener disposes of itself while being notified, the remaining listeners are still notified", ({ expect }) => {
        const runtime = createRuntime();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        const dispose = runtime.registerDeferredRegistrationScopeStartedListener(() => {
            dispose();
        });

        runtime.registerDeferredRegistrationScopeStartedListener(listener2);
        runtime.registerDeferredRegistrationScopeStartedListener(listener3);

        runtime.startDeferredRegistrationScope();

        expect(listener2).toHaveBeenCalledOnce();
        expect(listener3).toHaveBeenCalledOnce();
    });

    test.concurrent("when a listener throws, the error doesn't escape the scope start", ({ expect }) => {
        const runtime = createRuntime();

        runtime.registerDeferredRegistrationScopeStartedListener(() => {
            throw new Error("Something went wrong!");
        });

        expect(() => runtime.startDeferredRegistrationScope()).not.toThrow();
    });

    test.concurrent("when a listener throws, the remaining listeners are still notified", ({ expect }) => {
        const runtime = createRuntime();
        const listener1 = vi.fn();
        const listener3 = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener1);

        runtime.registerDeferredRegistrationScopeStartedListener(() => {
            throw new Error("Something went wrong!");
        });

        runtime.registerDeferredRegistrationScopeStartedListener(listener3);

        runtime.startDeferredRegistrationScope();

        expect(listener1).toHaveBeenCalledOnce();
        expect(listener3).toHaveBeenCalledOnce();
    });

    test.concurrent("a listener registered from a runtime scope is notified by the runtime", ({ expect }) => {
        const runtime = createRuntime();
        const scope = new DummyRuntimeScope(runtime, new NoopLogger());
        const listener = vi.fn();

        scope.registerDeferredRegistrationScopeStartedListener(listener);

        runtime.startDeferredRegistrationScope();

        expect(listener).toHaveBeenCalledExactlyOnceWith("register");
    });

    test.concurrent("a listener removed from a runtime scope is not notified by the runtime", ({ expect }) => {
        const runtime = createRuntime();
        const scope = new DummyRuntimeScope(runtime, new NoopLogger());
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        scope.removeDeferredRegistrationScopeStartedListener(listener);

        runtime.startDeferredRegistrationScope();

        expect(listener).not.toHaveBeenCalled();
    });
});
