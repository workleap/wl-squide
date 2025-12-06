import { Runtime, RuntimeContext } from "@squide/core";
import { renderHook, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { ReactNode } from "react";
import { test } from "vitest";
import { InMemoryLaunchDarklyClient, LaunchDarklyClientNotifier } from "../src/InMemoryLaunchDarklyClient.ts";
import { LaunchDarklyPlugin } from "../src/LaunchDarklyPlugin.ts";
import { useFeatureFlags } from "../src/useFeatureFlags.ts";

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

function renderUseFeatureFlags(runtime: Runtime) {
    return renderHook(() => useFeatureFlags(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                {children}
            </RuntimeContext.Provider>
        )
    });
}

test.concurrent("can return the feature flags", ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true
    }));

    const client = new InMemoryLaunchDarklyClient(flags);

    const runtime = new DummyRuntime({
        loggers: [new NoopLogger()],
        plugins: [
            x => new LaunchDarklyPlugin(x, client)
        ]
    });

    const { result } = renderUseFeatureFlags(runtime);

    expect(result.current).toEqual({
        "flag-a": true
    });
});

test.concurrent("when a feature flag value is updated, return the updated feature flags", async ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
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

    const { result } = renderUseFeatureFlags(runtime);

    expect(result.current).toEqual({
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
    });

    flags.set("flag-b", false);

    notifier.notify("change", {
        "flag-b": false
    });

    await waitFor(() => {
        expect(result.current).toEqual({
            "flag-a": true,
            "flag-b": false,
            "flag-c": true
        });
    });
});

test.concurrent("when a feature flag is added, return the updated feature flags", async ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
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

    const { result } = renderUseFeatureFlags(runtime);

    expect(result.current).toEqual({
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
    });

    flags.set("flag-d", true);

    notifier.notify("change", {
        "flag-d": true
    });

    await waitFor(() => {
        expect(result.current).toEqual({
            "flag-a": true,
            "flag-b": true,
            "flag-c": true,
            "flag-d": true
        });
    });
});

test.concurrent("when a feature flag is delete, return the updated feature flags", async ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
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

    const { result } = renderUseFeatureFlags(runtime);

    expect(result.current).toEqual({
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
    });

    flags.delete("flag-b");

    notifier.notify("change", {
        "flag-b": undefined
    });

    await waitFor(() => {
        expect(result.current).toEqual({
            "flag-a": true,
            "flag-c": true
        });
    });
});
