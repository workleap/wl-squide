import { MswPlugin } from "@squide/msw";
import { MswState } from "@squide/msw/internal";
import { NoopLogger } from "@workleap/logging";
import type { DataStrategyFunctionArgs, DataStrategyMatch } from "react-router";
import { describe, test, vi } from "vitest";
import { createWaitForMswDataStrategy } from "../src/AppRouter.tsx";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";

function createMatch(routeId: string, shouldCallHandler: boolean, result: unknown): DataStrategyMatch {
    return {
        route: { id: routeId } as DataStrategyMatch["route"],
        shouldCallHandler,
        resolve: vi.fn().mockResolvedValue(result)
    } as unknown as DataStrategyMatch;
}

describe("createWaitForMswDataStrategy", () => {
    test("when MSW is already ready, resolves immediately and calls loaders", async ({ expect }) => {
        const mswState = new MswState({ isReady: true });

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, { state: mswState })],
            loggers: [new NoopLogger()]
        });

        const strategy = createWaitForMswDataStrategy(runtime);

        const match1 = createMatch("route-1", true, { type: "data", result: "data-1" });
        const match2 = createMatch("route-2", true, { type: "data", result: "data-2" });

        const result = await strategy({
            matches: [match1, match2]
        } as unknown as DataStrategyFunctionArgs);

        expect(result).toEqual({
            "route-1": { type: "data", result: "data-1" },
            "route-2": { type: "data", result: "data-2" }
        });

        expect(match1.resolve).toHaveBeenCalledOnce();
        expect(match2.resolve).toHaveBeenCalledOnce();
    });

    test("when MSW is not ready, waits for MSW ready listener before calling loaders", async ({ expect }) => {
        const mswState = new MswState({ isReady: false });

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, { state: mswState })],
            loggers: [new NoopLogger()]
        });

        const strategy = createWaitForMswDataStrategy(runtime);

        const match = createMatch("route-1", true, { type: "data", result: "data-1" });

        const resultPromise = strategy({
            matches: [match]
        } as unknown as DataStrategyFunctionArgs);

        // The loader should not have been called yet since MSW is not ready.
        expect(match.resolve).not.toHaveBeenCalled();

        // Simulate MSW becoming ready.
        mswState.setAsReady();

        const result = await resultPromise;

        expect(result).toEqual({
            "route-1": { type: "data", result: "data-1" }
        });

        expect(match.resolve).toHaveBeenCalledOnce();
    });

    test("when some matches have shouldCallHandler false, only calls loaders for matching routes", async ({ expect }) => {
        const mswState = new MswState({ isReady: true });

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, { state: mswState })],
            loggers: [new NoopLogger()]
        });

        const strategy = createWaitForMswDataStrategy(runtime);

        const match1 = createMatch("route-1", true, { type: "data", result: "data-1" });
        const match2 = createMatch("route-2", false, { type: "data", result: "data-2" });
        const match3 = createMatch("route-3", true, { type: "data", result: "data-3" });

        const result = await strategy({
            matches: [match1, match2, match3]
        } as unknown as DataStrategyFunctionArgs);

        expect(result).toEqual({
            "route-1": { type: "data", result: "data-1" },
            "route-3": { type: "data", result: "data-3" }
        });

        expect(match1.resolve).toHaveBeenCalledOnce();
        expect(match2.resolve).not.toHaveBeenCalled();
        expect(match3.resolve).toHaveBeenCalledOnce();
    });

    test("when MSW is not ready, the ready listener is removed after MSW becomes ready", async ({ expect }) => {
        const mswState = new MswState({ isReady: false });

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, { state: mswState })],
            loggers: [new NoopLogger()]
        });

        const strategy = createWaitForMswDataStrategy(runtime);

        const match = createMatch("route-1", true, { type: "data", result: "data-1" });

        const resultPromise = strategy({
            matches: [match]
        } as unknown as DataStrategyFunctionArgs);

        expect(mswState.listenersCount).toBe(1);

        // Simulate MSW becoming ready.
        mswState.setAsReady();

        await resultPromise;

        expect(mswState.listenersCount).toBe(0);
    });

    test("when there are no matches to load, returns an empty object", async ({ expect }) => {
        const mswState = new MswState({ isReady: true });

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, { state: mswState })],
            loggers: [new NoopLogger()]
        });

        const strategy = createWaitForMswDataStrategy(runtime);

        const result = await strategy({
            matches: []
        } as unknown as DataStrategyFunctionArgs);

        expect(result).toEqual({});
    });
});
