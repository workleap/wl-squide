import { LaunchDarklyClientNotifier } from "@squide/launch-darkly";
import { test, vi } from "vitest";
import { FeatureFlagSetSnapshot } from "../src/FeatureFlagSetSnapshot.ts";
import { InMemoryLaunchDarklyClient } from "../src/InMemoryLaunchDarklyClient.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
        "flag-c": boolean;
        "flag-d": boolean;
    }
}

test.concurrent("initially set the client flags as the current snapshot", ({ expect }) => {
    const flags = {
        "flag-a": true
    };

    const client = new InMemoryLaunchDarklyClient(flags);
    const snapshot = new FeatureFlagSetSnapshot(client);

    expect(snapshot.value).toEqual(flags);
});

test.concurrent("when the flags are retrieved twice, the same snapshot object is returned", ({ expect }) => {
    const flags = {
        "flag-a": true
    };

    const client = new InMemoryLaunchDarklyClient(flags);
    const snapshot = new FeatureFlagSetSnapshot(client);

    const value1 = snapshot.value;
    const value2 = snapshot.value;

    expect(value1).toBe(value2);
});

test.concurrent("when the client flags change, the snapshot is updated", ({ expect }) => {
    const flags = {
        "flag-a": true,
        "flag-b": true
    };

    const client = new InMemoryLaunchDarklyClient(flags);
    const snapshot = new FeatureFlagSetSnapshot(client);

    const value1 = snapshot.value;

    // Must use "setFeatureFlags" rather than a custom notifier because of InMemoryLaunchDarklyClient "object literal snapshot".
    client.setFeatureFlags({
        "flag-b": false
    });

    const value2 = snapshot.value;

    expect(value1).not.toBe(value2);
    expect(value2["flag-b"]).toBeFalsy();
});

test.concurrent("can add listeners", ({ expect }) => {
    const flags = {
        "flag-a": true,
        "flag-b": true
    };

    const client = new InMemoryLaunchDarklyClient(flags);
    const snapshot = new FeatureFlagSetSnapshot(client);

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    snapshot.addSnapshotChangedListener(listener1);
    snapshot.addSnapshotChangedListener(listener2);

    const changes = {
        "flag-b": false
    };

    // Must use "setFeatureFlags" rather than a custom notifier because of InMemoryLaunchDarklyClient "object literal snapshot".
    client.setFeatureFlags(changes);

    const changeset = {
        "flag-b": {
            current: false,
            previous: true
        }
    };

    // Fake clients do not compute the changes as the Launch Darkly SDK client does, so we receive undefined.
    expect(listener1).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(changes), changeset);
    expect(listener2).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(changes), changeset);
});

test.concurrent("can remove listeners", ({ expect }) => {
    const flags = {
        "flag-a": true,
        "flag-b": true
    };

    const notifier = new LaunchDarklyClientNotifier();

    const client = new InMemoryLaunchDarklyClient(flags, {
        notifier
    });

    const snapshot = new FeatureFlagSetSnapshot(client);

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    snapshot.addSnapshotChangedListener(listener1);
    snapshot.addSnapshotChangedListener(listener2);

    snapshot.removeSnapshotChangedListener(listener1);
    snapshot.removeSnapshotChangedListener(listener2);

    const changes = {
        "flag-b": false
    };

    // Must use "setFeatureFlags" rather than a custom notifier because of InMemoryLaunchDarklyClient "object literal snapshot".
    client.setFeatureFlags(changes);

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
});
