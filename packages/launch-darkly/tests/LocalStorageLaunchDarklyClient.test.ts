import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { createLocalStorageLaunchDarklyClient, DefaultLocalStorageKey } from "../src/LocalStorageLaunchDarklyClient.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
        "flag-c": boolean;
    }
}

const TestLocalStorageKey = "test-feature-flags";

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
            localStorageKey: TestLocalStorageKey
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

        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
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

        localStorage.setItem(TestLocalStorageKey, JSON.stringify(storedFlags));

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual(storedFlags);
    });

    test("when the local storage has deprecated flags, do not load them", ({ expect }) => {
        const defaultFlags = {
            "flag-a": true
        };

        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": false,
            "invalid-flag": "should-be-ignored"
        }));

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
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

        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": false,
            "invalid-flag": "should-be-ignored"
        }));

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual({
            "flag-a": false
        });
    });

    test("when the local storage is missing default flags, load them", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": true,
            "flag-c": true
        };

        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": true
        }));

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
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

        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": true
        }));

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual({
            "flag-a": true,
            "flag-b": true,
            "flag-c": true
        });
    });

    test("when a local storage key is provided, use the provided key", ({ expect }) => {
        const key = "abc123";

        const defaultFlags = {
            "flag-a": true,
            "flag-b": true,
            "flag-c": true
        };

        createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: key
        });

        expect(JSON.parse(localStorage.getItem(key)!)).toEqual({
            "flag-a": true,
            "flag-b": true,
            "flag-c": true
        });
    });

    test("when no local storage key is provided, use the default key", ({ expect }) => {
        const defaultFlags = {
            "flag-a": true,
            "flag-b": true,
            "flag-c": true
        };

        createLocalStorageLaunchDarklyClient(defaultFlags);

        expect(JSON.parse(localStorage.getItem(DefaultLocalStorageKey)!)).toEqual({
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
            localStorageKey: TestLocalStorageKey
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
            localStorageKey: TestLocalStorageKey
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
            localStorageKey: TestLocalStorageKey
        });

        expect(client.variation("flag-a", false)).toBeTruthy();
    });

    test("when the flag doesn't exist and a default value is provided, return the default value", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        expect(client.variation("flag-a", false)).toBeFalsy();
    });

    test("when the flag doesn't exist and no default value is provided, return undefined", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
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
            localStorageKey: TestLocalStorageKey
        });

        expect(client.variationDetail("flag-a", false)).toEqual({
            value: true
        });
    });

    test.concurrent("when the flag doesn't exist and a default value is provided, return the default value", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        expect(client.variationDetail("flag-a", false)).toEqual({
            value: false
        });
    });

    test.concurrent("when the flag doesn't exist and no default value is provided, return undefined", ({ expect }) => {
        const defaultFlags = {};

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
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
            localStorageKey: TestLocalStorageKey
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual({
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
            localStorageKey: TestLocalStorageKey
        });

        client.setFeatureFlags({
            "flag-a": true
        });

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual({
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
            localStorageKey: TestLocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({
            "flag-a": {
                current: true,
                previous: false
            },
            "flag-b": {
                current: true,
                previous: false
            }
        });
    });

    test("when notify is false, do not trigger a change notification", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
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
            localStorageKey: TestLocalStorageKey
        });

        client.setFeatureFlags({
            "flag-a": true,
            "flag-b": true
        });

        expect(client.variation("flag-a")).toBeTruthy();
    });
});

describe("startTransaction", () => {
    test("can start a transaction", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const transaction = client.startTransaction();

        expect(transaction.isActive).toBeTruthy();
    });

    test("when a transaction is in progress, the updated flags are returned", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        expect(client.allFlags()).toEqual({
            "flag-a": false,
            "flag-b": true
        });

        expect(client.variation("flag-b")).toBeTruthy();
    });

    test("when a transaction is in progress, the updated flags are not persisted to local storage", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        expect(client.allFlags()).toEqual({
            "flag-a": false,
            "flag-b": true
        });

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual({
            "flag-a": false,
            "flag-b": false
        });
    });

    test("when a transaction is in progress, updating the flags doesn't trigger a notification", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        expect(listener).not.toHaveBeenCalled();
    });

    test("when a transaction is committed, the updated flags are returned", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const transaction = client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        transaction.commit();

        expect(client.allFlags()).toEqual({
            "flag-a": false,
            "flag-b": true
        });
    });

    test("when a transaction is committed, the updated flags are persisted to local storage", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const transaction = client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        transaction.commit();

        expect(JSON.parse(localStorage.getItem(TestLocalStorageKey)!)).toEqual({
            "flag-a": false,
            "flag-b": true
        });
    });

    test("when a transaction is committed, all pending notifications are triggered", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const listener1 = vi.fn();
        const listener2 = vi.fn();

        client.on("change", listener1);
        client.on("change", listener2);

        const transaction = client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        transaction.commit();

        const changeset = {
            "flag-b": {
                current: true,
                previous: false
            }
        };

        expect(listener1).toHaveBeenCalledExactlyOnceWith(changeset);
        expect(listener2).toHaveBeenCalledExactlyOnceWith(changeset);
    });

    test.concurrent("when a transaction is undo, restore the original flags", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const transaction = client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        transaction.undo();

        expect(client.allFlags()).toEqual({
            "flag-a": false,
            "flag-b": false
        });
    });

    test.concurrent("when a transaction is undo, do not trigger pending notifications", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        const transaction = client.startTransaction();

        client.setFeatureFlags({
            "flag-b": true
        });

        transaction.undo();

        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("cannot start more than one transaction at a time", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        client.startTransaction();

        // eslint-disable-next-line @stylistic/max-statements-per-line
        expect(() => { client.startTransaction(); }).toThrow();
    });

    test.concurrent("can complete and start a new transaction", ({ expect }) => {
        const flags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(flags, {
            localStorageKey: TestLocalStorageKey
        });

        const transaction1 = client.startTransaction();
        transaction1.commit();

        const transaction2 = client.startTransaction();
        transaction2.undo();

        // eslint-disable-next-line @stylistic/max-statements-per-line
        expect(() => { client.startTransaction(); }).not.toThrow();
    });
});

describe("storage changed event", () => {
    test("getting flags after a storage changed event returns the updated values", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        // Simulate a local storage change from another tab.
        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        // Simulate a local storage change event.
        const storageEvent = new StorageEvent("storage", {
            key: TestLocalStorageKey,
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
            localStorageKey: TestLocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        // Simulate a local storage change from another tab.
        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
            "flag-a": true,
            "flag-b": false
        }));

        // Simulate a local storage change event.
        const storageEvent = new StorageEvent("storage", {
            key: TestLocalStorageKey,
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

        expect(listener).toHaveBeenCalledExactlyOnceWith({
            "flag-a": {
                current: true,
                previous: false
            }
        });
    });

    test("do not trigger a change notification when it's a different storage key", ({ expect }) => {
        const defaultFlags = {
            "flag-a": false,
            "flag-b": false
        };

        const client = createLocalStorageLaunchDarklyClient(defaultFlags, {
            localStorageKey: TestLocalStorageKey
        });

        const listener = vi.fn();

        client.on("change", listener);

        // Simulate a local storage change from another tab.
        localStorage.setItem(TestLocalStorageKey, JSON.stringify({
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
