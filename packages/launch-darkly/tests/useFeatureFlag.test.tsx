import { Runtime, RuntimeContext } from "@squide/core";
import { createLocalStorageLaunchDarklyClient, FeatureFlagKey, FeatureFlags } from "@squide/launch-darkly";
import { renderHook, RenderHookResult, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, test } from "vitest";
import { InMemoryLaunchDarklyClient } from "../src/InMemoryLaunchDarklyClient.ts";
import { LaunchDarklyPlugin } from "../src/LaunchDarklyPlugin.ts";
import { useFeatureFlag } from "../src/useFeatureFlag.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
        "flag-c": boolean;
        "flag-d": boolean;
    }
}

class DummyRuntime extends Runtime {
    registerRoute() {
        throw new Error("Method not implemented.");
    }

    registerPublicRoute() {
        throw new Error("Method not implemented.");
    }

    get routes() {
        return [];
    }

    registerNavigationItem() {
        throw new Error("Method not implemented.");
    }

    getNavigationItems() {
        return [];
    }

    startDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    completeDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    startScope(): Runtime {
        return new DummyRuntime({ loggers: [new NoopLogger()] });
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderUseFeatureFlagHook<T extends FeatureFlagKey>(runtime: Runtime, key: T, defaultValue?: FeatureFlags[T]): [RenderHookResult<any, unknown>, () => number] {
    let renderCount = 0;

    const renderCountAccessor = () => {
        return renderCount;
    };

    // eslint-disable-next-line testing-library/render-result-naming-convention
    const result = renderHook(() => {
        renderCount += 1;

        return useFeatureFlag(key, defaultValue);
    }, {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                {children}
            </RuntimeContext.Provider>
        )
    });

    return [result, renderCountAccessor];
}

describe.concurrent("InMemoryLaunchDarklyClient", () => {
    test.concurrent("when the flag exist, return the flag value", ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a", false);

        expect(result.current).toBeTruthy();
    });

    test.concurrent("when the flag doesn't exist, and a default value is provided, return the default value", ({ expect }) => {
        const flags = {};
        const client = new InMemoryLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a", false);

        expect(result.current).toBeFalsy();
    });

    test.concurrent("when the flag doesn't exist, and no default value is provided, return undefined", ({ expect }) => {
        const flags = {};
        const client = new InMemoryLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a");

        expect(result.current).toBeUndefined();
    });

    test.concurrent("when the flag value is updated, return the updated value", async ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }, renderCountAccessor] = renderUseFeatureFlagHook(runtime, "flag-a");

        expect(result.current).toBeTruthy();

        client.setFeatureFlags({
            "flag-a": false
        });

        await waitFor(() => {
            expect(result.current).toBeFalsy();
        });

        expect(renderCountAccessor()).toBe(2);
    });

    test.concurrent("when another flag value is updated, do not update the value", async ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }, renderCountAccessor] = renderUseFeatureFlagHook(runtime, "flag-a");

        expect(result.current).toBeTruthy();

        client.setFeatureFlags({
            "flag-b": false
        });

        await waitFor(() => {
            expect(result.current).toBeTruthy();
        });

        expect(renderCountAccessor()).toBe(1);
    });
});

describe("LocalStorageLaunchDarklyClient", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    test("when the flag exist, return the flag value", ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = createLocalStorageLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a", false);

        expect(result.current).toBeTruthy();
    });

    test("when the flag doesn't exist, and a default value is provided, return the default value", ({ expect }) => {
        const flags = {};
        const client = createLocalStorageLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a", false);

        expect(result.current).toBeFalsy();
    });

    test("when the flag doesn't exist, and no default value is provided, return undefined", ({ expect }) => {
        const flags = {};
        const client = createLocalStorageLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a");

        expect(result.current).toBeUndefined();
    });

    test("when the flag value is updated, return the updated value", async ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = createLocalStorageLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }, renderCountAccessor] = renderUseFeatureFlagHook(runtime, "flag-a");

        expect(result.current).toBeTruthy();

        client.setFeatureFlags({
            "flag-a": false
        });

        await waitFor(() => {
            expect(result.current).toBeFalsy();
        });

        expect(renderCountAccessor()).toBe(2);
    });

    test("when another flag value is updated, do not update the value", async ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = createLocalStorageLaunchDarklyClient(flags);

        const runtime = new DummyRuntime({
            loggers: [new NoopLogger()],
            plugins: [
                x => new LaunchDarklyPlugin(x, client)
            ]
        });

        const [{ result }, renderCountAccessor] = renderUseFeatureFlagHook(runtime, "flag-a");

        expect(result.current).toBeTruthy();

        client.setFeatureFlags({
            "flag-b": false
        });

        await waitFor(() => {
            expect(result.current).toBeTruthy();
        });

        expect(renderCountAccessor()).toBe(1);
    });
});
