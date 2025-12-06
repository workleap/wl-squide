import { InMemoryLaunchDarklyClient } from "@squide/launch-darkly";
import { test, vi } from "vitest";
import { initializeFireflyForStorybook } from "../src/initializeFireflyForStorybook.ts";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        baseUrl: string;
    }
}

test.concurrent("when local modules are provided, the local modules are registered", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        localModules: [
            () => {}
        ]
    });

    await vi.waitFor(() => expect(runtime.moduleManager.getAreModulesReady()).toBeTruthy());
});

test.concurrent("when environment variables are provided, the environment variables are available from the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        environmentVariables: {
            baseUrl: "/foo"
        }
    });

    expect(runtime.getEnvironmentVariable("baseUrl")).toBe("/foo");
});

test.concurrent("when a launch darkly client is provided, the client is available from the runtime", async ({ expect }) => {
    const featureFlags = new Map<string, boolean>(Object.entries({
        "flag-a": true
    }));

    const client = new InMemoryLaunchDarklyClient(featureFlags);

    const runtime = await initializeFireflyForStorybook({
        launchDarklyClient: client
    });

    expect(runtime.launchDarklyClient).toBe(client);
});

test.concurrent("when no launch darkly client is provided and no feature flags are provided, a launch darkly client is available from the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook();

    expect(runtime.launchDarklyClient).toBeDefined();
});

test.concurrent("when feature flags are provided, the feature flags are available from the runtime", async ({ expect }) => {
    const runtime = await initializeFireflyForStorybook({
        featureFlags: {
            "flag-a": true
        }
    });

    expect(runtime.getFeatureFlag("flag-a")).toBeTruthy();
});
