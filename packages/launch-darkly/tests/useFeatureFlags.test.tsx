import { Runtime, RuntimeContext } from "@squide/core";
import { renderHook, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { ReactNode } from "react";
import { test } from "vitest";
import { InMemoryLaunchDarklyClient } from "../src/InMemoryLaunchDarklyClient.ts";
import { LaunchDarklyPlugin } from "../src/LaunchDarklyPlugin.ts";
import { useFeatureFlags } from "../src/useFeatureFlags.ts";

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

    const { result } = renderUseFeatureFlags(runtime);

    expect(result.current).toEqual({
        "flag-a": true
    });
});

test.concurrent("when a feature flag value is updated, return the updated feature flags", async ({ expect }) => {
    const flags = {
        "flag-a": true,
        "flag-b": true,
        "flag-c": true
    };

    const client = new InMemoryLaunchDarklyClient(flags);

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

    client.setFeatureFlags({
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
