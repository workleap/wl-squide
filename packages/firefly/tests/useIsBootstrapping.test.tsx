import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { test } from "vitest";
import { AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterState } from "../src/AppRouterReducer.ts";
import { useIsBootstrapping } from "../src/useIsBootstrapping.ts";
import { createDefaultAppRouterState } from "./utils.ts";

function renderUseIsBootstrappingHook<TProps>(state: AppRouterState, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useIsBootstrapping(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <AppRouterStateContext.Provider value={state}>
                {children}
            </AppRouterStateContext.Provider>
        ),
        ...additionalProps
    });
}

test.concurrent("when modules are ready, and msw is ready, public data is ready, and protected data is ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when msw is not ready but it's not required to wait for msw, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.waitForMsw = false;
    state.isMswReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when public data is not ready but it's not required to wait for public data, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;
    state.waitForPublicData = false;
    state.isPublicDataReady = false;
    state.isProtectedDataReady = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when protected data is not ready but it's not required to wait for protected data, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;
    state.isPublicDataReady = true;
    state.waitForProtectedData = false;
    state.isProtectedDataReady = false;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when protected data is not ready but the active route is public, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;
    state.isPublicDataReady = true;
    state.activeRouteVisibility = "public";
    state.isProtectedDataReady = false;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when modules are not ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = false;
    state.isMswReady = true;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when msw is not ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.waitForMsw = true;
    state.isMswReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when public data is not ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;
    state.waitForPublicData = true;
    state.isPublicDataReady = false;
    state.isProtectedDataReady = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when protected data is not ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;
    state.isPublicDataReady = true;
    state.waitForProtectedData = true;
    state.activeRouteVisibility = "protected";
    state.isProtectedDataReady = false;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the session is unauthorized, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = false;
    state.isUnauthorized = true;

    const { result } = renderUseIsBootstrappingHook(state);

    expect(result.current).toBeFalsy();
});
