import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { test } from "vitest";
import { AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterState } from "../src/AppRouterReducer.ts";
import { useCanFetchProtectedData } from "../src/useCanFetchProtectedData.ts";
import { createDefaultAppRouterState } from "./utils.ts";

function renderUseCanFetchProtectedDataHook<TProps>(state: AppRouterState, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useCanFetchProtectedData(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <AppRouterStateContext.Provider value={state}>
                {children}
            </AppRouterStateContext.Provider>
        ),
        ...additionalProps
    });
}

test.concurrent("when the protected data has already been fetched, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.isProtectedDataReady = true;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are registered, the active route is protected, and msw is ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are ready, and the active route is protected, and msw is ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are registered or ready, the active route is protected, and msw is not ready but it's not required to wait for msw, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForMsw = false;
    state.areModulesReady = true;
    state.activeRouteVisibility = "protected";

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are not registered, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when the modules are not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = false;
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when the active route is not protected, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.activeRouteVisibility = "public";
    state.isMswReady = true;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when it's required to wait for msw and msw is not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForMsw = true;
    state.areModulesReady = true;
    state.activeRouteVisibility = "protected";
    state.isMswReady = false;

    const { result } = renderUseCanFetchProtectedDataHook(state);

    expect(result.current).toBeFalsy();
});
