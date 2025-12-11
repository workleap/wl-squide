import { test, vi } from "vitest";
import { FeatureFlagSetSnapshot } from "../src/FeatureFlagSetSnapshot.ts";
import { InMemoryLaunchDarklyClient, LaunchDarklyClientNotifier } from "../src/InMemoryLaunchDarklyClient.ts";

declare module "@squide/launch-darkly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
    }
}

test.concurrent("initially set the client flags as the current snapshot", ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true
    }));

    const client = new InMemoryLaunchDarklyClient(flags);
    const snapshot = new FeatureFlagSetSnapshot(client);

    expect(snapshot.value).toEqual(Object.fromEntries(flags));
});

test.concurrent("when the flags are retrieved twice, the same snapshot object is returned", ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true
    }));

    const client = new InMemoryLaunchDarklyClient(flags);
    const snapshot = new FeatureFlagSetSnapshot(client);

    const value1 = snapshot.value;
    const value2 = snapshot.value;

    expect(value1).toBe(value2);
});

test.concurrent("when the client flags change, the snapshot is updated", ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true
    }));

    const notifier = new LaunchDarklyClientNotifier();

    const client = new InMemoryLaunchDarklyClient(flags, {
        notifier
    });

    const snapshot = new FeatureFlagSetSnapshot(client);

    const value1 = snapshot.value;

    flags.set("flag-b", false);

    notifier.notify("change", {
        "flag-b": false
    });

    const value2 = snapshot.value;

    expect(value1).not.toBe(value2);
    expect(value2["flag-b"]).toBeFalsy();
});

test.concurrent("can add listeners", ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true
    }));

    const notifier = new LaunchDarklyClientNotifier();

    const client = new InMemoryLaunchDarklyClient(flags, {
        notifier
    });

    const snapshot = new FeatureFlagSetSnapshot(client);

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    snapshot.addSnapshotChangedListener(listener1);
    snapshot.addSnapshotChangedListener(listener2);

    flags.set("flag-b", false);

    const changes = {
        "flag-b": false
    };

    notifier.notify("change", changes);

    expect(listener1).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(changes), changes);
    expect(listener2).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(changes), changes);
});

test.concurrent("can remove listeners", ({ expect }) => {
    const flags = new Map(Object.entries({
        "flag-a": true
    }));

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

    flags.set("flag-b", false);

    const changes = {
        "flag-b": false
    };

    notifier.notify("change", changes);

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
});

