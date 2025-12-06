import { describe, test } from "vitest";
import { InMemoryLaunchDarklyClient } from "../src/InMemoryLaunchDarklyClient.ts";

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

