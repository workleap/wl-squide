import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { createLocalStorageLaunchDarklyClient } from "../src/LocalStorageLaunchDarklyClient.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
        "flag-c": boolean;
    }
}

const LocalStorageKey = "test-feature-flags";

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

describe("createLocalStorageLaunchDarklyClient", () => {
    test("when the local storage is empty, the local storage is initialized with default flags", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variation("flag-a")).toBe(false);
        expect(client.variation("flag-b")).toBe(true);
        expect(client.variation("flag-c")).toBe(true);
    });

    test("when the local storage has existing flags, the existing flag values have priority over the default flags values", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true
        };

        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variation("flag-a")).toBe(true);
        expect(client.variation("flag-b")).toBe(false);
    });

    test("when the local storage has existing flags, and the existing flags are not deprecated, do not remove them from the local storage", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true
        };

        const storedFlags = {
            "flag-a": true,
            "flag-b": false
        };

        localStorage.setItem(LocalStorageKey, JSON.stringify(storedFlags));

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(JSON.parse(localStorage.getItem(LocalStorageKey)!)).toEqual(storedFlags);
    });

    test("when the local storage has deprecated flags, do not load them", ({ expect }) => {
        const defaultFlags = {
            "flag-a": true
        };

        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": false,
            "invalid-flag": "should-be-ignored"
        }));

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": false
        });
    });

    test("when the local storage has deprecated flags, remove them from the local storage", ({ expect }) => {
        const defaultFlags = {
            "flag-a": true
        };

        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": false,
            "invalid-flag": "should-be-ignored"
        }));

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(JSON.parse(localStorage.getItem(LocalStorageKey)!)).toEqual({
            "flag-a": false
        });
    });

    test("when the local storage is missing default flags, load them", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        };

        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": true
        }));

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.allFlags()).toEqual({
            "flag-a": true,
            "flag-b": true,
            "flag-c": true
        });
    });

    test("when the local storage is missing default flags, add those default flags to the local storage", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        };

        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": true
        }));

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(JSON.parse(localStorage.getItem(LocalStorageKey)!)).toEqual({
            "flag-a": true,
            "flag-b": true,
            "flag-c": true
        });
    });
});

describe("allFlags", () => {
    test("return all the flags", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.allFlags()).toEqual({
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        });
    });

    test("when the flags are retrieved twice, the same object reference is returned", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        const obj1 = client.allFlags();
        const obj2 = client.allFlags();

        expect(obj1).toBe(obj2);
    });
});

describe("variation", () => {
    test("when the flag exist, return the flag value", ({ expect }) => {
        const defaultFlags = {
            "flag-a": true
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variation("flag-a", false)).toBeTruthy();
    });

    test("when the flag doesn't exist and a default value is provided, return the default value", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variation("flag-a", false)).toBeFalsy();
    });

    test("when the flag doesn't exist and no default value is provided, return undefined", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variation("flag-a")).toBeUndefined();
    });
});

describe("variationDetail", () => {
    test.concurrent("when the flag exist, return the flag", ({ expect }) => {
        const defaultFlags = {
            "flag-a": true
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variationDetail("flag-a", false)).toEqual({
            value: true
        });
    });

    test.concurrent("when the flag doesn't exist and a default value is provided, return the default value", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variationDetail("flag-a", false)).toEqual({
            value: false
        });
    });

    test.concurrent("when the flag doesn't exist and no default value is provided, return undefined", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        expect(client.variationDetail("flag-a")).toEqual({
            value: undefined
        });
    });
});

describe("setFeatureFlags", () => {
    test("can update multiple flag values", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(JSON.parse(localStorage.getItem(LocalStorageKey)!)).toEqual({
            "flag-a": true,
            "flag-b": true
        });

        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": true,
            "flag-b": true
        });
    });

    test("can update a single flag value", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        client.setFeatureFlags({
            "flag-a": true
        });

        expect(JSON.parse(localStorage.getItem(LocalStorageKey)!)).toEqual({
            "flag-a": true
        });

        const allFlags = client.allFlags();

        expect(allFlags).toEqual({
            "flag-a": true
        });
    });

    test("triggers a change notification", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(listener).toHaveBeenCalledOnce();
    });

    test("when notify is false, do not trigger a change notification", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

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

    test("getting a variation after updating values returns the updated value", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(client.variation("flag-a")).toBeTruthy();
    });
});

describe("storage changed event", () => {
    test("getting flags after a storage changed event returns the updated values", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        // Simulate a local storage change from another tab.
        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        // Simulate a local storage change event.
        const storageEvent = new StorageEvent("storage", {
            key: LocalStorageKey,
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

    test("triggers a change notification", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        // Simulate a local storage change from another tab.
        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        // Simulate a local storage change event.
        const storageEvent = new StorageEvent("storage", {
            key: LocalStorageKey,
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

        expect(listener).toHaveBeenCalledOnce();
    });

    test("do not trigger a change notification when it's a different storage key", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: LocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        // Simulate a local storage change from another tab.
        localStorage.setItem(LocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        // Simulate a local storage change event.
        const storageEvent = new StorageEvent("storage", {
            key: "123abc",
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

        expect(listener).not.toHaveBeenCalled();
    });
});
