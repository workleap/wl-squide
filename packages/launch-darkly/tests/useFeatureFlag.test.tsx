import { Runtime, RuntimeContext } from "@squide/core";
import { renderHook, RenderHookResult, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { ReactNode } from "react";
import { test } from "vitest";
import { InMemoryLaunchDarklyClient, LaunchDarklyClientNotifier } from "../src/InMemoryLaunchDarklyClient.ts";
import { LaunchDarklyPlugin } from "../src/LaunchDarklyPlugin.ts";
import { useFeatureFlag } from "../src/useFeatureFlag.ts";

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
function renderUseFeatureFlagHook(runtime: Runtime, key: string, defaultValue?: unknown): [RenderHookResult<any, unknown>, () => number] {
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

test.concurrent("when the flag exist, return the flag value", ({ expect }) => {
    const flags = new Map<string, boolean>(Object.entries({
        "flag-a": true
    }));

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
    const flags = new Map<string, boolean>();
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

test.concurrent("when the flag doesn't exist, and not default value is provided, return undefined", ({ expect }) => {
    const flags = new Map<string, boolean>();
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
    const flags = new Map<string, boolean>(Object.entries({
        "flag-a": true
    }));

    const notifier = new LaunchDarklyClientNotifier();

    const client = new InMemoryLaunchDarklyClient(flags, {
        notifier
    });

    const runtime = new DummyRuntime({
        loggers: [new NoopLogger()],
        plugins: [
            x => new LaunchDarklyPlugin(x, client)
        ]
    });

    const [{ result }, renderCountAccessor] = renderUseFeatureFlagHook(runtime, "flag-a");

    expect(result.current).toBeTruthy();

    flags.set("flag-a", false);

    notifier.notify("change", {
        "flag-a": false
    });

    await waitFor(() => {
        expect(result.current).toBeFalsy();
    });

    expect(renderCountAccessor()).toBe(2);
});

test.concurrent("when another flag value is updated, do not update the value", async ({ expect }) => {
    const flags = new Map<string, boolean>(Object.entries({
        "flag-a": true
    }));

    const notifier = new LaunchDarklyClientNotifier();

    const client = new InMemoryLaunchDarklyClient(flags, {
        notifier
    });

    const runtime = new DummyRuntime({
        loggers: [new NoopLogger()],
        plugins: [
            x => new LaunchDarklyPlugin(x, client)
        ]
    });

    const [{ result }, renderCountAccessor] = renderUseFeatureFlagHook(runtime, "flag-a");

    expect(result.current).toBeTruthy();

    flags.set("flag-b", false);

    notifier.notify("change", {
        "flag-b": false
    });

    await waitFor(() => {
        expect(result.current).toBeTruthy();
    });

    expect(renderCountAccessor()).toBe(1);
});

test.concurrent("when a flag is deleted, return undefined", async ({ expect }) => {
    const flags = new Map<string, boolean>(Object.entries({
        "flag-a": true
    }));

    const notifier = new LaunchDarklyClientNotifier();

    const client = new InMemoryLaunchDarklyClient(flags, {
        notifier
    });

    const runtime = new DummyRuntime({
        loggers: [new NoopLogger()],
        plugins: [
            x => new LaunchDarklyPlugin(x, client)
        ]
    });

    const [{ result }] = renderUseFeatureFlagHook(runtime, "flag-a");

    expect(result.current).toBeTruthy();

    flags.delete("flag-a");

    notifier.notify("change", {
        "flag-a": undefined
    });

    await waitFor(() => {
        expect(result.current).toBeUndefined();
    });
});
