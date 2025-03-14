import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterState } from "../src/AppRouterReducer.ts";
import { useCanRegisterDeferredRegistrations } from "../src/useCanRegisterDeferredRegistrations.ts";
import { createDefaultAppRouterState } from "./utils.ts";

function renderUseCanRegisterDeferredRegistrationsHook<TProps>(state: AppRouterState, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useCanRegisterDeferredRegistrations(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <AppRouterStateContext.Provider value={state}>
                {children}
            </AppRouterStateContext.Provider>
        ),
        ...additionalProps
    });
}

test("when modules are registered but not ready, public data is ready, and protected data is ready, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when public data is not ready but it's not required to wait for public data, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.waitForPublicData = false;
    state.isPublicDataReady = false;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when protected data is not ready but it's not required to wait for protected data, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.waitForProtectedData = false;
    state.activeRouteVisibility = "protected";
    state.isProtectedDataReady = false;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when protected data is not ready but the route is public, return true", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.activeRouteVisibility = "public";
    state.isProtectedDataReady = false;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test("when modules are ready, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = true;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test("when the session is unauthorized, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isUnauthorized = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test("when it's required to wait for public data and public data is not ready, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.waitForPublicData = true;
    state.isPublicDataReady = false;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test("when it's required to wait for protected data and the protected data is not ready, return false", () => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.activeRouteVisibility = "protected";
    state.waitForProtectedData = true;
    state.isProtectedDataReady = false;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});
