import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { test } from "vitest";
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

test.concurrent("when modules are registered but not ready, public data is ready, and protected data is ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when public data is not ready but it's not required to wait for public data, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForPublicData = false;
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = false;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when protected data is not ready but it's not required to wait for protected data, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForProtectedData = false;
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.activeRouteVisibility = "protected";
    state.isProtectedDataReady = false;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when protected data is not ready but the route is public, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.activeRouteVisibility = "public";
    state.isProtectedDataReady = false;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when modules are ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = true;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when the session is unauthorized, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isUnauthorized = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when it's required to wait for public data and public data is not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForPublicData = true;
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = false;
    state.isProtectedDataReady = true;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when it's required to wait for protected data and the protected data is not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForProtectedData = true;
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.activeRouteVisibility = "protected";
    state.isProtectedDataReady = false;

    const { result } = renderUseCanRegisterDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});
