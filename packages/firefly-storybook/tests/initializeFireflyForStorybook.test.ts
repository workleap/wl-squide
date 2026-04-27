import { Plugin } from "@squide/firefly";
import { InMemoryLaunchDarklyClient } from "@squide/launch-darkly";
import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { initializeFireflyForStorybook } from "../src/initializeFireflyForStorybook.ts";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        baseUrl: string;
    }

    interface FeatureFlags {
        "flag-a": boolean;
    }
}

class DummyPlugin extends Plugin {}

test.concurrent("when local modules are provided, the local modules are registered", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        localModules: [
            () => {}
        ],
        loggers: [new NoopLogger()]
    });

    await vi.waitFor(() => expect(runtime.moduleManager.getAreModulesReady()).toBeTruthy());
});

test.concurrent("when environment variables are provided, the environment variables are available from the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        environmentVariables: {
            baseUrl: "/foo"
        },
        loggers: [new NoopLogger()]
    });

    expect(runtime.getEnvironmentVariable("baseUrl")).toBe("/foo");
});

test.concurrent("when a launch darkly client is provided, the client is available from the runtime", async ({ expect }) => {
    const flags = {
        "flag-a": true
    };

    const client = new InMemoryLaunchDarklyClient(flags);

    const runtime = await initializeFireflyForStorybook({
        launchDarklyClient: client,
        loggers: [new NoopLogger()]
    });

    expect(runtime.launchDarklyClient).toBe(client);
});

test.concurrent("when no launch darkly client is provided and no feature flags are provided, a launch darkly client is available from the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        loggers: [new NoopLogger()]
    });

    expect(runtime.launchDarklyClient).toBeDefined();
});

test.concurrent("when feature flags are provided, the feature flags are available from the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        featureFlags: {
            "flag-a": true
        },
        loggers: [new NoopLogger()]
    });

    expect(runtime.getFeatureFlag("flag-a")).toBeTruthy();
});

test.concurrent("when no local modules are provided, modules are ready", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        loggers: [new NoopLogger()]
    });

    await vi.waitFor(() => expect(runtime.moduleManager.getAreModulesReady()).toBeTruthy());
});

test.concurrent("when additional plugins are provided, plugins are added to the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        additionalPlugins: [x => new DummyPlugin("plugin-1", x), x => new DummyPlugin("plugin-2", x)]
    });

    await vi.waitFor(() => expect(runtime.getPlugin("plugin-1")).toBeDefined());
    await vi.waitFor(() => expect(runtime.getPlugin("plugin-2")).toBeDefined());
});

