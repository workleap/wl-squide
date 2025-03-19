import { renderHook } from "@testing-library/react";
import { test } from "vitest";
import { useCanRenderRouter } from "../src/AppRouter.tsx";
import { createDefaultAppRouterState } from "./utils.ts";

test.concurrent("when modules are not registered and modules are not ready return false", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.areModulesReady = false;

    const { result } = renderHook(() => useCanRenderRouter(state));

    expect(result.current).toBeFalsy();
});

test.concurrent("when modules are not registered but modules are ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.areModulesReady = true;

    const { result } = renderHook(() => useCanRenderRouter(state));

    expect(result.current).toBeTruthy();
});

test.concurrent("when modules are registered but modules are not ready, return true", ({ expect }) => {
    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;

    const { result } = renderHook(() => useCanRenderRouter(state));

    expect(result.current).toBeTruthy();
});
