import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterState } from "../src/AppRouterReducer.ts";
import { useCanUpdateDeferredRegistrations } from "../src/useCanUpdateDeferredRegistrations.ts";
import { createDefaultAppRouterState } from "./utils.ts";

function renderUseCanUpdateDeferredRegistrationsHook<TProps>(state: AppRouterState, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useCanUpdateDeferredRegistrations(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <AppRouterStateContext.Provider value={state}>
                {children}
            </AppRouterStateContext.Provider>
        ),
        ...additionalProps
    });
}

test("when modules are ready, the deferred registrations has been registered once, and the public data has been updated, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state.publicDataUpdatedAt = Date.parse("2020-03-14");

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when modules are ready, the deferred registrations has been registered once, and the protected data has been updated, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state.protectedDataUpdatedAt = Date.parse("2020-03-14");

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when modules are ready, the deferred registrations has been registered once, the public data has been updated, and the protected data has been updated, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state.publicDataUpdatedAt = Date.parse("2020-03-14");
    state.protectedDataUpdatedAt = Date.parse("2020-03-14");

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when modules are not ready, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = false;
    state.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state.publicDataUpdatedAt = Date.parse("2020-03-14");

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test("when there's no deferred registrations, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.deferredRegistrationsUpdatedAt = undefined;
    state.publicDataUpdatedAt = Date.parse("2020-02-14");

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test("when the public and protected data has not been updated, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state.publicDataUpdatedAt = undefined;
    state.protectedDataUpdatedAt = undefined;

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});
