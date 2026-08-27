import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import type { DeferredRegistrationScopeOptions } from "../src/plugins/Plugin.ts";
import { RuntimeScope } from "../src/runtime/Runtime.ts";
import { DummyRuntime } from "./DummyRuntime.ts";

class DummyRuntimeScope extends RuntimeScope {}

function createRuntime() {
    return new DummyRuntime({ loggers: [new NoopLogger()] });
}

const registerOptions: DeferredRegistrationScopeOptions = { operation: "register", transactional: false };
const updateOptions: DeferredRegistrationScopeOptions = { operation: "update", transactional: true };

// "_notifyDeferredRegistrationScopeStarted" is what "ModuleManager.#withDeferredRegistrationScope" drives.
// The ordering of the notification relative to the plugins and the modules is covered in ModuleManager.test.ts.
describe.concurrent("deferred registration scope started listeners", () => {
    test.concurrent("a registered listener is notified with the scope options", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ operation: "register", transactional: false });
    });

    test.concurrent("an update run forwards the update options", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime._notifyDeferredRegistrationScopeStarted(updateOptions);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ operation: "update", transactional: true });
    });

    test.concurrent("each listener receives its own copy of the options", ({ expect }) => {
        const runtime = createRuntime();

        let received: DeferredRegistrationScopeOptions | undefined;

        runtime.registerDeferredRegistrationScopeStartedListener(x => {
            // A faulty listener mutating the options must not affect the next one.
            x.operation = "update";
        });

        runtime.registerDeferredRegistrationScopeStartedListener(x => {
            received = x;
        });

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(received?.operation).toBe("register");
        expect(registerOptions.operation).toBe("register");
    });

    test.concurrent("every registered listener is notified, in registration order", ({ expect }) => {
        const runtime = createRuntime();
        const calls: string[] = [];

        runtime.registerDeferredRegistrationScopeStartedListener(() => {
            calls.push("first");
        });

        runtime.registerDeferredRegistrationScopeStartedListener(() => {
            calls.push("second");
        });

        runtime.registerDeferredRegistrationScopeStartedListener(() => {
            calls.push("third");
        });

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(calls).toEqual(["first", "second", "third"]);
    });

    test.concurrent("a listener is notified for every run", ({ expect }) => {
        const runtime = createRuntime();
        const operations: string[] = [];

        runtime.registerDeferredRegistrationScopeStartedListener(x => {
            operations.push(x.operation);
        });

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);
        runtime._notifyDeferredRegistrationScopeStarted(updateOptions);
        runtime._notifyDeferredRegistrationScopeStarted(updateOptions);

        expect(operations).toEqual(["register", "update", "update"]);
    });

    test.concurrent("a listener registered twice is only notified once", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.registerDeferredRegistrationScopeStartedListener(listener);

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("a removed listener is not notified", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(listener);
        runtime.removeDeferredRegistrationScopeStartedListener(listener);

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("the returned disposer removes the listener", ({ expect }) => {
        const runtime = createRuntime();
        const listener = vi.fn();

        const dispose = runtime.registerDeferredRegistrationScopeStartedListener(listener);

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        dispose();

        runtime._notifyDeferredRegistrationScopeStarted(updateOptions);

        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("removing an unknown listener doesn't throw", ({ expect }) => {
        const runtime = createRuntime();

        expect(() => runtime.removeDeferredRegistrationScopeStartedListener(vi.fn())).not.toThrow();
    });

    // This is the case that pins the "new Set(...)" copy in "_notifyDeferredRegistrationScopeStarted".
    // Iterating the live set would skip listener 2, since it is removed before the iteration reaches it.
    test.concurrent("when a listener disposes of another listener while being notified, that listener is still notified", ({ expect }) => {
        const runtime = createRuntime();
        const listener2 = vi.fn();

        runtime.registerDeferredRegistrationScopeStartedListener(() => {
            runtime.removeDeferredRegistrationScopeStartedListener(listener2);
        });

        runtime.registerDeferredRegistrationScopeStartedListener(listener2);

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(listener2).toHaveBeenCalledOnce();
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

        runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

        expect(listener2).toHaveBeenCalledOnce();
        expect(listener3).toHaveBeenCalledOnce();
    });

    describe.concurrent("completion functions", () => {
        test.concurrent("a returned completion function is collected", ({ expect }) => {
            const runtime = createRuntime();
            const completionFunction = vi.fn();

            runtime.registerDeferredRegistrationScopeStartedListener(() => completionFunction);

            const completionFunctions = runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

            expect(completionFunctions).toEqual([completionFunction]);
            // Collecting is not executing, the caller decides when the run has settled.
            expect(completionFunction).not.toHaveBeenCalled();
        });

        test.concurrent("a listener returning nothing contributes no completion function", ({ expect }) => {
            const runtime = createRuntime();

            runtime.registerDeferredRegistrationScopeStartedListener(() => {});

            expect(runtime._notifyDeferredRegistrationScopeStarted(registerOptions)).toEqual([]);
        });

        test.concurrent("a listener returning a non function contributes no completion function", ({ expect }) => {
            const runtime = createRuntime();

            // Guards against a listener written as an arrow function with an implicit non function return.
            runtime.registerDeferredRegistrationScopeStartedListener(() => "nope" as unknown as () => void);

            expect(runtime._notifyDeferredRegistrationScopeStarted(registerOptions)).toEqual([]);
        });

        test.concurrent("the completion functions are collected in registration order", ({ expect }) => {
            const runtime = createRuntime();
            const first = vi.fn();
            const second = vi.fn();

            runtime.registerDeferredRegistrationScopeStartedListener(() => first);
            runtime.registerDeferredRegistrationScopeStartedListener(() => {});
            runtime.registerDeferredRegistrationScopeStartedListener(() => second);

            expect(runtime._notifyDeferredRegistrationScopeStarted(registerOptions)).toEqual([first, second]);
        });
    });

    describe.concurrent("error isolation", () => {
        test.concurrent("when a listener throws, the error doesn't escape the notification", ({ expect }) => {
            const runtime = createRuntime();

            runtime.registerDeferredRegistrationScopeStartedListener(() => {
                throw new Error("Something went wrong!");
            });

            expect(() => runtime._notifyDeferredRegistrationScopeStarted(registerOptions)).not.toThrow();
        });

        test.concurrent("when a listener throws, the remaining listeners are still notified and their completion functions collected", ({ expect }) => {
            const runtime = createRuntime();
            const listener1 = vi.fn();
            const completionFunction = vi.fn();

            runtime.registerDeferredRegistrationScopeStartedListener(listener1);

            runtime.registerDeferredRegistrationScopeStartedListener(() => {
                throw new Error("Something went wrong!");
            });

            runtime.registerDeferredRegistrationScopeStartedListener(() => completionFunction);

            const completionFunctions = runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

            expect(listener1).toHaveBeenCalledOnce();
            expect(completionFunctions).toEqual([completionFunction]);
        });

        test.concurrent("when a listener throws, the error is logged", ({ expect }) => {
            const runtime = createRuntime();
            const errorSpy = vi.spyOn(runtime.logger, "error");

            runtime.registerDeferredRegistrationScopeStartedListener(() => {
                throw new Error("Something went wrong!");
            });

            runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

            expect(errorSpy).toHaveBeenCalledOnce();
        });
    });

    describe.concurrent("runtime scope", () => {
        test.concurrent("a listener registered from a runtime scope is notified by the runtime", ({ expect }) => {
            const runtime = createRuntime();
            const scope = new DummyRuntimeScope(runtime, new NoopLogger());
            const listener = vi.fn();

            scope.registerDeferredRegistrationScopeStartedListener(listener);

            runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

            expect(listener).toHaveBeenCalledOnce();
        });

        test.concurrent("a listener removed from a runtime scope is not notified by the runtime", ({ expect }) => {
            const runtime = createRuntime();
            const scope = new DummyRuntimeScope(runtime, new NoopLogger());
            const listener = vi.fn();

            runtime.registerDeferredRegistrationScopeStartedListener(listener);
            scope.removeDeferredRegistrationScopeStartedListener(listener);

            runtime._notifyDeferredRegistrationScopeStarted(registerOptions);

            expect(listener).not.toHaveBeenCalled();
        });

        test.concurrent("notifying from a runtime scope throws, it drives the run", ({ expect }) => {
            const runtime = createRuntime();
            const scope = new DummyRuntimeScope(runtime, new NoopLogger());

            expect(() => scope._notifyDeferredRegistrationScopeStarted()).toThrow();
        });
    });
});
