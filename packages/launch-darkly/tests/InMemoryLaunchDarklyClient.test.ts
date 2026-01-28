import { describe, test, vi } from "vitest";
import { InMemoryLaunchDarklyClient } from "../src/InMemoryLaunchDarklyClient.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
        "flag-c": boolean;
        "flag-d": boolean;
    }
}

describe.concurrent("allFlags", () => {
    test.concurrent("return all the flags", ({ expect }) => {
        const flags = {
            "flag-a": true,
            "flab-b": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.allFlags()).toEqual(flags);
    });

    test.concurrent("when the flags are retrieved twice, the same object reference is returned", ({ expect }) => {
        const flags = {
            "flag-a": true,
            "flab-b": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        const obj1 = client.allFlags();
        const obj2 = client.allFlags();

        expect(obj1).toBe(obj2);
    });
});

describe.concurrent("variation", () => {
    test.concurrent("when the flag exist, return the flag value", ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.variation("flag-a", false)).toBeTruthy();
    });

    test.concurrent("when the flag doesn't exist and a default value is provided, return the default value", ({ expect }) => {
        const flags = {};
        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.variation("flag-a", false)).toBeFalsy();
    });

    test.concurrent("when the flag doesn't exist and no default value is provided, return undefined", ({ expect }) => {
        const flags = {};
        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.variation("flag-a")).toBeUndefined();
    });
});

describe.concurrent("variationDetail", () => {
    test.concurrent("when the flag exist, return the flag value", ({ expect }) => {
        const flags = {
            "flag-a": true
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.variationDetail("flag-a", false)).toEqual({
            value: true
        });
    });

    test.concurrent("when the flag doesn't exist and a default value is provided, return the default value", ({ expect }) => {
        const flags = {};
        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.variationDetail("flag-a", false)).toEqual({
            value: false
        });
    });

    test.concurrent("when the flag doesn't exist and no default value is provided, return undefined", ({ expect }) => {
        const flags = {};
        const client = new InMemoryLaunchDarklyClient(flags);

        expect(client.variationDetail("flag-a")).toEqual({
            value: undefined
        });
    });
});

describe.concurrent("setFeatureFlags", () => {
    test.concurrent("can update multiple flag values", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": true,
            "flag-b": true
        });
    });

    test.concurrent("can update a single flag value", ({ expect }) => {
        const flags = {
            "flag-a": false
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-a": true
        });

        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": true
        });
    });

    test.concurrent("triggers a change notification", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        const listener = vi.fn();

        client.on("change", listener);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("when notify is false, do not trigger a change notification", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        const listener = vi.fn();

        client.on("change", listener);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        }, {
            notify: false
        });

        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("getting a variation after updating values returns the updated value", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(client.variation("flag-a")).toBeTruthy();
    });
});

