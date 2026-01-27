import { describe, test } from "vitest";
import { InMemoryLaunchDarklyClient } from "../src/InMemoryLaunchDarklyClient.ts";

/*

allFlags

- return all the flags
- when the flags are retrieved twice, the same object reference is returned

*/

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
    }
}

describe("variation", () => {
    test.concurrent("when the flag is available, return the flag", ({ expect }) => {
        const flags = new Map(Object.entries({
            "flag-a": true
        }));

        const client = new InMemoryLaunchDarklyClient(flags);

        const value = client.variation("flag-a", false);

        expect(value).toBeTruthy();
    });

    test.concurrent("when the flag is not available and a default value is provided, return the default value", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        const value = client.variation("flag-a", false);

        expect(value).toBeFalsy();
    });

    test.concurrent("when the flag is not available and no default value is provided, return undefined", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        const value = client.variation("flag-a");

        expect(value).toBeUndefined();
    });
});

describe("variationDetail", () => {
    test.concurrent("when the flag is available, return the flag", ({ expect }) => {
        const flags = new Map(Object.entries({
            "flag-a": true
        }));

        const client = new InMemoryLaunchDarklyClient(flags);

        const value = client.variationDetail("flag-a", false);

        expect(value).toEqual({
            value: true
        });
    });

    test.concurrent("when the flag is not available and a default value is provided, return the default value", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        const value = client.variationDetail("flag-a", false);

        expect(value).toEqual({
            value: false
        });
    });

    test.concurrent("when the flag is not available and no default value is provided, return undefined", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        const value = client.variationDetail("flag-a");

        expect(value).toEqual({
            value: undefined
        });
    });
});

describe("setFeatureFlags", () => {
    test.concurrent("when setting multiple feature flags, all flags are added", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": false
        });

        expect(client.variation("flag-a")).toBeTruthy();
        expect(client.variation("flag-b")).toBeFalsy();
    });

    test.concurrent("when updating existing feature flags, all flags are updated", ({ expect }) => {
        const flags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true
        }));
        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": false
        });

        expect(client.variation("flag-a")).toBeTruthy();
        expect(client.variation("flag-b")).toBeFalsy();
    });

    test.concurrent("when setting multiple feature flags with the notify option set to true, the change listener is notified with all flags", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        let notifiedValue: Record<string, boolean> | undefined;

        client.on("change", (value: Record<string, boolean>) => {
            notifiedValue = value;
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": false
        }, { notify: true });

        expect(notifiedValue).toEqual({
            "flag-a": true,
            "flag-b": false
        });
    });

    test.concurrent("when setting multiple feature flags without a notify option, the change listener is notified", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        let notified = false;

        client.on("change", () => {
            notified = true;
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": false
        });

        expect(notified).toBeTruthy();
    });

    test.concurrent("when setting multiple feature flags with the notify option set to false, the listeners are not called", ({ expect }) => {
        const flags = new Map<string, boolean>();
        const client = new InMemoryLaunchDarklyClient(flags);

        let notified = false;

        client.on("change", () => {
            notified = true;
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": false
        }, { notify: false });

        expect(notified).toBeFalsy();
    });

    test.concurrent("when setting multiple feature flags with mixed values, all values are set", ({ expect }) => {
        const flags = new Map<string, boolean | string | number>();
        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-bool": true,
            "flag-string": "enabled",
            "flag-number": 42
        });

        expect(client.variation("flag-bool")).toBe(true);
        expect(client.variation("flag-string")).toBe("enabled");
        expect(client.variation("flag-number")).toBe(42);
    });

    test.concurrent("when setting multiple feature flags, existing flags not in the update are preserved", ({ expect }) => {
        const flags = new Map(Object.entries({
            "flag-a": true,
            "flag-b": false,
            "flag-c": true
        }));
        const client = new InMemoryLaunchDarklyClient(flags);

        client.setFeatureFlags({
            "flag-a": false
        });

        expect(client.variation("flag-a")).toBeFalsy();
        expect(client.variation("flag-b")).toBeFalsy();
        expect(client.variation("flag-c")).toBeTruthy();
    });
});

