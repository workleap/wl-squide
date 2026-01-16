import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LocalStorageLaunchDarklyClient } from "../src/LocalStorageLaunchDarklyClient.ts";

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
    vi.clearAllMocks();
});

afterEach(() => {
    localStorage.clear();
});

describe("initialization", () => {
    test("when localStorage is empty, initialize with default flags", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        expect(client.variation("flag-a")).toBe(false);
        expect(client.variation("flag-b")).toBe(true);
        expect(client.variation("flag-c")).toBe(true);
    });

    test("when localStorage has existing flags, load them", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        expect(client.variation("flag-a")).toBe(true);
        expect(client.variation("flag-b")).toBe(false);
    });

    test("when localStorage has extra invalid flags, ignore them", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            "flag-a": true,
            "invalid-flag": "should-be-ignored"
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": true
        });
        expect(allFlags).not.toHaveProperty("invalid-flag");
    });

    test("when localStorage is missing some flags, add them with default values", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            "flag-a": true
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        expect(client.variation("flag-a")).toBe(true);
        expect(client.variation("flag-b")).toBe(true);
        expect(client.variation("flag-c")).toBe(true);
    });

    test("saves initialized flags to localStorage", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": true
        }));

        new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        expect(stored).toEqual({
            "flag-a": false,
            "flag-b": true
        });
    });
});

describe("setFeatureFlag", () => {
    test("updates localStorage when a flag is changed", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        client.setFeatureFlag("flag-a", true);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        expect(stored).toEqual({
            "flag-a": true
        });
    });

    test("triggers change notification", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();
        client.on("change", changeHandler);

        client.setFeatureFlag("flag-a", true);

        expect(changeHandler).toHaveBeenCalledWith({
            "flag-a": true
        });
    });
});

describe("setFeatureFlags", () => {
    test("updates localStorage with multiple flags", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": false
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        expect(stored).toEqual({
            "flag-a": true,
            "flag-b": true
        });
    });

    test("triggers change notification with all modified flags", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": false
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
        const changeHandler = vi.fn();
        client.on("change", changeHandler);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(changeHandler).toHaveBeenCalledWith({
            "flag-a": true,
            "flag-b": true
        });
    });
});

describe("storage event synchronization", () => {
    test("updates flags when localStorage changes from another tab", () => {
        const defaultFlags = new Map(Object.entries({
            "flag-a": false,
            "flag-b": false
        }));

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

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

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
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

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
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

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);

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

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
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

        const client = new LocalStorageLaunchDarklyClient(STORAGE_KEY, defaultFlags);
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

