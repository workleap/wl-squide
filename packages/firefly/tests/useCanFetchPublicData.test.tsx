import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { test } from "vitest";
import { AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterState } from "../src/AppRouterReducer.ts";
import { useCanFetchPublicData } from "../src/useCanFetchPublicData.ts";
import { createDefaultAppRouterState } from "./utils.ts";

function renderUseCanFetchPublicDataHook<TProps>(state: AppRouterState, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useCanFetchPublicData(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <AppRouterStateContext.Provider value={state}>
                {children}
            </AppRouterStateContext.Provider>
        ),
        ...additionalProps
    });
}

test.concurrent("when the public data has already been fetched, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.isPublicDataReady = true;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are registered and msw is ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.isMswReady = true;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are ready and msw is ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;
    state.isMswReady = true;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are registered or ready and msw is not ready but it's not required to wait for msw, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForMsw = false;
    state.areModulesReady = true;
    state.isMswReady = false;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when the modules are not registered, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.isMswReady = true;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when the modules are not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.areModulesReady = false;
    state.isMswReady = true;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeFalsy();
});

test.concurrent("when it's required to wait for msw and msw is not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.waitForMsw = true;
    state.areModulesReady = true;
    state.isMswReady = false;

    const { result } = renderUseCanFetchPublicDataHook(state);

    expect(result.current).toBeFalsy();
});
