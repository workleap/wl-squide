import {
    DeferredRegistrationsUpdateCompletedEvent,
    FireflyProvider,
    FireflyRuntime,
    useStrictRegistrationMode
} from "@squide/firefly";
import { act, renderHook } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";

// Validation used to run once, driven by a one-shot modules-ready listener that the deferred registrations
// update path never re-notified. An item left pending by an update run therefore surfaced only on a page
// reload. See ADR-0022.

function renderUseStrictRegistrationModeHook(runtime: FireflyRuntime, isEnabled?: boolean) {
    return renderHook(() => useStrictRegistrationMode({ isEnabled }), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <FireflyProvider runtime={runtime}>
                {children}
            </FireflyProvider>
        )
    });
}

test("when a deferred registrations update completes, the navigation item registrations are validated again", () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });

    const validateRegistrations = vi.spyOn(runtime, "_validateRegistrations").mockImplementation(() => {});

    renderUseStrictRegistrationModeHook(runtime);

    validateRegistrations.mockClear();

    act(() => {
        runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);
    });

    expect(validateRegistrations).toHaveBeenCalledTimes(1);

    // Routes are frozen after the first registration phase, re-validating them could only re-throw a
    // bootstrap misconfiguration on every update run.
    expect(validateRegistrations).toHaveBeenCalledWith({ includeRoutes: false });
});

test("when the modules are ready, the route registrations are validated as well", () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });

    vi.spyOn(runtime.moduleManager, "getAreModulesReady").mockReturnValue(true);

    const validateRegistrations = vi.spyOn(runtime, "_validateRegistrations").mockImplementation(() => {});

    renderUseStrictRegistrationModeHook(runtime);

    expect(validateRegistrations).toHaveBeenCalledTimes(1);
    expect(validateRegistrations).toHaveBeenCalledWith();
});

test("when strict mode is disabled, a completed deferred registrations update does not validate the registrations", () => {
    const runtime = new FireflyRuntime({ loggers: [new NoopLogger()] });

    const validateRegistrations = vi.spyOn(runtime, "_validateRegistrations").mockImplementation(() => {});

    renderUseStrictRegistrationModeHook(runtime, false);

    act(() => {
        runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);
    });

    expect(validateRegistrations).not.toHaveBeenCalled();
});

test("when a completed deferred registrations update left a navigation item pending, an error is thrown in development", () => {
    const runtime = new FireflyRuntime({
        mode: "development",
        loggers: [new NoopLogger()]
    });

    runtime.registerNavigationItem({
        $label: "Link",
        to: "/link"
    }, {
        sectionId: "section"
    });

    renderUseStrictRegistrationModeHook(runtime);

    expect(() => {
        act(() => {
            runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);
        });
    }).toThrow(/Missing navigation section "section"/);
});

test("when a completed deferred registrations update left a navigation item pending, no error is thrown in production", () => {
    const runtime = new FireflyRuntime({
        mode: "production",
        loggers: [new NoopLogger()]
    });

    runtime.registerNavigationItem({
        $label: "Link",
        to: "/link"
    }, {
        sectionId: "section"
    });

    renderUseStrictRegistrationModeHook(runtime);

    expect(() => {
        act(() => {
            runtime.eventBus.dispatch(DeferredRegistrationsUpdateCompletedEvent);
        });
    }).not.toThrow();
});
