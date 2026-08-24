import type { ModuleRegisterFunction } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { describe, expect, test, vi } from "vitest";
import { DeferredRegistrationsUpdatedEvent } from "../src/AppRouterReducer.ts";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { createDeferredRegistrationsRunner } from "../src/testing/index.ts";
import { DeferredRegistrationsUpdateCompletedEvent, DeferredRegistrationsUpdateStartedEvent } from "../src/useUpdateDeferredRegistrations.ts";

function createRuntime() {
    return new FireflyRuntime({ loggers: [new NoopLogger()] });
}

interface FeatureFlags {
    isFlagOn: boolean;
}

describe("register", () => {
    test("when the runner is registered, the module registration functions are executed", async () => {
        const runtime = createRuntime();
        const fct = vi.fn();

        const runner = createDeferredRegistrationsRunner(runtime, [fct]);

        await runner.register();

        expect(fct).toHaveBeenCalledTimes(1);
    });

    test("when the runner is registered, the deferred registration functions are executed with the \"register\" operation", async () => {
        const runtime = createRuntime();
        const deferred = vi.fn();

        const runner = createDeferredRegistrationsRunner<FireflyRuntime, unknown, FeatureFlags>(runtime, [() => deferred]);

        await runner.register({ isFlagOn: true });

        expect(deferred).toHaveBeenCalledTimes(1);
        expect(deferred.mock.calls[0][1]).toEqual({ isFlagOn: true });
        expect(deferred.mock.calls[0][2]).toBe("register");
    });

    test("when a context is provided, the module registration functions receive the context", async () => {
        const runtime = createRuntime();
        const fct = vi.fn();

        const runner = createDeferredRegistrationsRunner<FireflyRuntime, { foo: string }>(runtime, [fct], {
            context: { foo: "bar" }
        });

        await runner.register();

        expect(fct.mock.calls[0][1]).toEqual({ foo: "bar" });
    });

    test("when a module registration function throws, the error is returned", async () => {
        const runtime = createRuntime();

        const runner = createDeferredRegistrationsRunner(runtime, [
            () => { throw new Error("module boom"); }
        ]);

        const errors = await runner.register();

        expect(errors.length).toBe(1);
        expect((errors[0].cause as Error).message).toBe("module boom");
    });

    test("when a deferred registration function throws, the error is returned", async () => {
        const runtime = createRuntime();

        const runner = createDeferredRegistrationsRunner(runtime, [
            () => () => { throw new Error("deferred boom"); }
        ]);

        const errors = await runner.register();

        expect(errors.length).toBe(1);
        expect((errors[0].cause as Error).message).toBe("deferred boom");
    });

    test("when the runner is already registered, throw an error", async () => {
        const runtime = createRuntime();
        const runner = createDeferredRegistrationsRunner(runtime, []);

        await runner.register();

        await expect(runner.register()).rejects.toThrow(/can only be called once/);
    });
});

describe("update", () => {
    test("when the runner is updated, the deferred registration functions are executed with the \"update\" operation", async () => {
        const runtime = createRuntime();
        const deferred = vi.fn();

        const runner = createDeferredRegistrationsRunner<FireflyRuntime, unknown, FeatureFlags>(runtime, [() => deferred]);

        await runner.register({ isFlagOn: false });
        await runner.update({ isFlagOn: true });

        expect(deferred).toHaveBeenCalledTimes(2);
        expect(deferred.mock.calls[1][1]).toEqual({ isFlagOn: true });
        expect(deferred.mock.calls[1][2]).toBe("update");
    });

    test("when the runner is updated, the update started and completed events are dispatched", async () => {
        const runtime = createRuntime();

        const startedListener = vi.fn();
        const completedListener = vi.fn();

        runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, startedListener);
        runtime.eventBus.addListener(DeferredRegistrationsUpdateCompletedEvent, completedListener);

        const runner = createDeferredRegistrationsRunner(runtime, []);

        await runner.register();

        expect(startedListener).not.toHaveBeenCalled();
        expect(completedListener).not.toHaveBeenCalled();

        await runner.update();

        expect(startedListener).toHaveBeenCalledTimes(1);
        expect(completedListener).toHaveBeenCalledTimes(1);
    });

    test("when the runner is updated, the app router store is notified that the deferred registrations has been updated", async () => {
        const runtime = createRuntime();
        const runner = createDeferredRegistrationsRunner(runtime, []);

        await runner.register();

        expect(runtime.appRouterStore.state.deferredRegistrationsUpdatedAt).toBeUndefined();

        await runner.update();

        expect(runtime.appRouterStore.state.deferredRegistrationsUpdatedAt).toBeDefined();
    });

    test("when the runner is updated, the deferred registrations updated event is dispatched", async () => {
        const runtime = createRuntime();
        const listener = vi.fn();

        runtime.eventBus.addListener(DeferredRegistrationsUpdatedEvent, listener);

        const runner = createDeferredRegistrationsRunner(runtime, []);

        await runner.register();

        expect(listener).not.toHaveBeenCalled();

        await runner.update();

        expect(listener).toHaveBeenCalledTimes(1);
    });

    test("when the runner is updated, the events are dispatched in the same order as the useUpdateDeferredRegistrations hook", async () => {
        const runtime = createRuntime();
        const calls: string[] = [];

        runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => calls.push("started"));
        runtime.eventBus.addListener(DeferredRegistrationsUpdatedEvent, () => calls.push("updated"));
        runtime.eventBus.addListener(DeferredRegistrationsUpdateCompletedEvent, () => calls.push("completed"));

        const runner = createDeferredRegistrationsRunner(runtime, [
            () => (_runtime, _data, operation) => {
                calls.push(operation);
            }
        ]);

        await runner.register();
        await runner.update();

        expect(calls).toEqual(["register", "started", "update", "updated", "completed"]);
    });

    test("when a deferred registration function throws during an update, the error is returned", async () => {
        const runtime = createRuntime();
        let shouldThrow = false;

        const runner = createDeferredRegistrationsRunner(runtime, [
            () => () => {
                if (shouldThrow) {
                    throw new Error("update boom");
                }
            }
        ]);

        await runner.register();

        shouldThrow = true;

        const errors = await runner.update();

        expect(errors.length).toBe(1);
        expect((errors[0].cause as Error).message).toBe("update boom");
    });

    test("when the runner has not been registered, throw an error", async () => {
        const runtime = createRuntime();
        const runner = createDeferredRegistrationsRunner(runtime, []);

        await expect(runner.update()).rejects.toThrow(/must be called before the "update" function/);
    });
});

describe("navigation items", () => {
    // A module owning a flag gated navigation section, and another module registering a nested item under
    // that section. This is the shape that surfaces defects on the deferred registrations update path.
    const registerSectionModule: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = () => {
        return (runtime, data) => {
            if (data.isFlagOn) {
                runtime.registerNavigationItem({ $id: "section", $label: "Section", children: [] });
            }
        };
    };

    const registerNestedItemModule: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = () => {
        return runtime => {
            runtime.registerNavigationItem({ $id: "nested", $label: "Nested", to: "/nested" }, { sectionId: "section" });
        };
    };

    test("when a section is registered by another module, the nested items are registered under the section", async () => {
        const runtime = createRuntime();

        const runner = createDeferredRegistrationsRunner(runtime, [registerSectionModule, registerNestedItemModule]);

        await runner.register({ isFlagOn: true });

        const items = runtime.getNavigationItems();

        expect(items.length).toBe(1);
        expect((items[0] as { children: unknown[] }).children.length).toBe(1);
    });

    test("when the flag is turned off, the navigation items of an update run are cleared", async () => {
        const runtime = createRuntime();

        const runner = createDeferredRegistrationsRunner(runtime, [registerSectionModule, registerNestedItemModule]);

        await runner.register({ isFlagOn: true });
        await runner.update({ isFlagOn: false });

        expect(runtime.getNavigationItems().length).toBe(0);
    });
});
