import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createLocalStorageLaunchDarklyClient } from "../src/LocalStorageLaunchDarklyClient.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
        "flag-c": boolean;
    }
}

const STORAGE_KEY = "test-feature-flags";

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

describe("createLocalStorageLaunchDarklyClient", () => {
    test("when the local storage is empty, initialize with default flags", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        expect(client.variation("flag-a")).toBe(false);
        expect(client.variation("flag-b")).toBe(true);
        expect(client.variation("flag-c")).toBe(true);
    });

    test("when the local storage has existing flags, load them", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            ["flag-a", true],
            ["flag-b", false]
        ]));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        expect(client.variation("flag-a")).toBe(true);
        expect(client.variation("flag-b")).toBe(false);
    });

    test("when the local storage has invalid flags, ignore them", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            ["flag-a", true],
            ["invalid-flag", "should-be-ignored"]
        ]));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": true
        });
        expect(allFlags).not.toHaveProperty("invalid-flag");
    });

    test("when the local storage is missing some flags, add them with default values", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            ["flag-a", true]
        ]));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        expect(client.variation("flag-a")).toBe(true);
        expect(client.variation("flag-b")).toBe(true);
        expect(client.variation("flag-c")).toBe(true);
    });

    test("saves initialized flags to localStorage", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true
        }));

        createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        expect(stored).toEqual([
            ["flag-a", false],
            ["flag-b", true]
        ]);
    });
});

describe("setFeatureFlags", () => {
    test("updates localStorage with multiple flags", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": false
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        expect(stored).toEqual([
            ["flag-a", true],
            ["flag-b", true]
        ]);
    });

    test("triggers change notification", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": false
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();
        client.on("change", changeHandler);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(changeHandler).toHaveBeenCalled();
    });
});

describe("storage event synchronization", () => {
    test("updates flags when the local storage changes from another tab", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": false
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        // Simulate storage event from another tab
        const storageEvent = new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: JSON.stringify({
                "flag-a": true,
                "flag-b": false
            }),
            oldValue: JSON.stringify({
                "flag-a": false,
                "flag-b": false
            })
        });

        window.dispatchEvent(storageEvent);

        expect(client.variation("flag-a")).toBe(true);
        expect(client.variation("flag-b")).toBe(false);
    });

    test("ignores storage events for different keys", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();
        client.on("change", changeHandler);

        // Simulate storage event for a different key
        const storageEvent = new StorageEvent("storage", {
            key: "different-key",
            newValue: JSON.stringify({
                "flag-a": true
            })
        });

        window.dispatchEvent(storageEvent);

        expect(client.variation("flag-a")).toBe(false);
        expect(changeHandler).not.toHaveBeenCalled();
    });

    test("ignores storage events with no newValue", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();
        client.on("change", changeHandler);

        // Simulate storage event with null newValue (item removed)
        const storageEvent = new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: null
        });

        window.dispatchEvent(storageEvent);

        expect(client.variation("flag-a")).toBe(false);
        expect(changeHandler).not.toHaveBeenCalled();
    });

    test("handles malformed JSON in storage events gracefully", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        // Simulate storage event with invalid JSON
        const storageEvent = new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: "invalid-json{{"
        });

        expect(() => {
            window.dispatchEvent(storageEvent);
        }).not.toThrow();

        expect(client.variation("flag-a")).toBe(false);
    });

    test("only triggers change notification for modified flags", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true,
            "flag-c": "value"
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();
        client.on("change", changeHandler);

        // Simulate storage event where only flag-a changes
        const storageEvent = new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: JSON.stringify({
                "flag-a": true,
                "flag-b": true,
                "flag-c": "value"
            })
        });

        window.dispatchEvent(storageEvent);

        expect(changeHandler).toHaveBeenCalledWith({
            "flag-a": true
        });
    });

    test("does not trigger change notification when no flags actually change", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();

        // Clear the initial call from constructor
        client.on("change", changeHandler);

        // Simulate storage event with same values
        const storageEvent = new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: JSON.stringify({
                "flag-a": false,
                "flag-b": true
            })
        });

        window.dispatchEvent(storageEvent);

        expect(changeHandler).not.toHaveBeenCalled();
    });
});

describe("variation", () => {
    test.concurrent("when the flag is available, return the flag", ({ expect }) => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": true
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const value = client.variation("flag-a", false);

        expect(value).toBeTruthy();
    });

    test("when the local storage has a flag value, it takes priority over the provided default value", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            ["flag-a", true]
        ]));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        // Even though we provide false as the default, localStorage value (true) should be returned
        const value = client.variation("flag-a", false);

        expect(value).toBe(true);
    });

    test.concurrent("when the flag is not available and a default value is provided, return the default value", ({ expect }) => {
        const defaultFlags = new Map<string, boolean>();
        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const value = client.variation("flag-a", false);

        expect(value).toBeFalsy();
    });

    test.concurrent("when the flag is not available and no default value is provided, return undefined", ({ expect }) => {
        const defaultFlags = new Map<string, boolean>();
        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const value = client.variation("flag-a");

        expect(value).toBeUndefined();
    });
});

describe("variationDetail", () => {
    test.concurrent("when the flag is available, return the flag", ({ expect }) => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": true
        }));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const value = client.variationDetail("flag-a", false);

        expect(value).toEqual({
            value: true
        });
    });

    test("when the local storage has a flag value, it takes priority over the provided default value", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            ["flag-a", true]
        ]));

        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        // Even though we provide false as the default, localStorage value (true) should be returned
        const value = client.variationDetail("flag-a", false);

        expect(value).toEqual({
            value: true
        });
    });

    test.concurrent("when the flag is not available and a default value is provided, return the default value", ({ expect }) => {
        const defaultFlags = new Map<string, boolean>();
        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const value = client.variationDetail("flag-a", false);

        expect(value).toEqual({
            value: false
        });
    });

    test.concurrent("when the flag is not available and no default value is provided, return undefined", ({ expect }) => {
        const defaultFlags = new Map<string, boolean>();
        const client = createLocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const value = client.variationDetail("flag-a");

        expect(value).toEqual({
            value: undefined
        });
    });
});
