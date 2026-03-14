import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { test } from "vitest";
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

test.concurrent("when modules are ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = true;

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeTruthy();
});

test.concurrent("when modules are not ready, return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesReady = false;

    const { result } = renderUseCanUpdateDeferredRegistrationsHook(state);

    expect(result.current).toBeFalsy();
});
