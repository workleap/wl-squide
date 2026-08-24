import {
    DeferredRegistrationsUpdateCompletedEvent,
    DeferredRegistrationsUpdateStartedEvent,
    FireflyProvider,
    FireflyRuntime,
    ModuleRegistrationError,
    useUpdateDeferredRegistrations
} from "@squide/firefly";
import { AppRouterDispatcherContext, type AppRouterDispatch } from "@squide/firefly/internal";
import { act, renderHook } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";

// These tests cover the half of the deferred registrations update contract that belongs to Squide: that the
// hook dispatches the update events around the module manager, and in which order. Applications cover the
// other half, that their modules react correctly to those events, with createDeferredRegistrationsRunner.
// A runner cannot cover this half because it stands in for this hook, therefore it dispatches the events itself.

function renderUseUpdateDeferredRegistrationsHook(runtime: FireflyRuntime, dispatch: AppRouterDispatch) {
    return renderHook(() => useUpdateDeferredRegistrations(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <FireflyProvider runtime={runtime}>
                <AppRouterDispatcherContext.Provider value={dispatch}>
                    {children}
                </AppRouterDispatcherContext.Provider>
            </FireflyProvider>
        )
    });
}

test("when the deferred registrations are updated, the started event is dispatched before the module manager update and the completed event after", async () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });
    const calls: string[] = [];

    runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => calls.push("started"));
    runtime.eventBus.addListener(DeferredRegistrationsUpdateCompletedEvent, () => calls.push("completed"));

    vi.spyOn(runtime.moduleManager, "updateDeferredRegistrations").mockImplementation(() => {
        calls.push("module-manager-update");

        return Promise.resolve([]);
    });

    const dispatch = vi.fn(() => {
        calls.push("app-router-dispatch");
    });

    const { result } = renderUseUpdateDeferredRegistrationsHook(runtime, dispatch);

    await act(async () => {
        await result.current();
    });

    expect(calls).toEqual(["started", "module-manager-update", "app-router-dispatch", "completed"]);
});

test("when the deferred registrations are updated, the data is forwarded to the module manager", async () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });

    const spy = vi.spyOn(runtime.moduleManager, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([]);
    });

    const { result } = renderUseUpdateDeferredRegistrationsHook(runtime, vi.fn());

    await act(async () => {
        await result.current({ isFlagOn: true });
    });

    expect(spy).toHaveBeenCalledWith({ isFlagOn: true });
});

test("when the deferred registrations are updated, the app router is notified that the deferred registrations has been updated", async () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });

    vi.spyOn(runtime.moduleManager, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([]);
    });

    const dispatch = vi.fn();

    const { result } = renderUseUpdateDeferredRegistrationsHook(runtime, dispatch);

    await act(async () => {
        await result.current();
    });

    expect(dispatch).toHaveBeenCalledWith({ type: "deferred-registrations-updated" });
});

test("when an error occurs while updating the deferred registrations, the errors are returned", async () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });
    const error = new ModuleRegistrationError("toto");

    vi.spyOn(runtime.moduleManager, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([error]);
    });

    const { result } = renderUseUpdateDeferredRegistrationsHook(runtime, vi.fn());

    let errors: ModuleRegistrationError[] = [];

    await act(async () => {
        errors = await result.current();
    });

    expect(errors).toEqual([error]);
});

test("when an error occurs while updating the deferred registrations, the completed event is still dispatched", async () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });
    const completedListener = vi.fn();

    runtime.eventBus.addListener(DeferredRegistrationsUpdateCompletedEvent, completedListener);

    vi.spyOn(runtime.moduleManager, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([new ModuleRegistrationError("toto")]);
    });

    const { result } = renderUseUpdateDeferredRegistrationsHook(runtime, vi.fn());

    await act(async () => {
        await result.current();
    });

    expect(completedListener).toHaveBeenCalledTimes(1);
});
