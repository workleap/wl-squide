import type { FederationHost } from "@module-federation/enhanced/runtime";
import { test } from "vitest";
import { resolveSharedDependency } from "../src/sharedDependenciesResolutionPlugin.ts";

type Shared = FederationHost["shareScopeMap"][string][string][string];

function createSharedEntry(from: string, version: string, singleton?: boolean): Shared {
    return {
        from,
        version,
        shareConfig: {
            singleton,
            requiredVersion: false
        },
        deps: [],
        get: () => () => {},
        scope: ["default"],
        strategy: "version-first",
        useIn: [from]
    };
}

test.concurrent("when a remote request a version with the same major version as the host requested version, but with an higher minor version, resolve to the remote requested version", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", "2.0.0", true),
        createSharedEntry("remote-1", "2.1.0", true),
        createSharedEntry("remote-2", "2.0.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("2.1.0");
});

test.concurrent("when a remote request a version with the same major version as the host requested version, but with an higher patch version, resolve to the remote requested version", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", "2.0.0", true),
        createSharedEntry("remote-1", "2.0.1", true),
        createSharedEntry("remote-2", "2.0.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.0.1");
    expect(highestVersionEntry.version).toBe("2.0.1");
});

test.concurrent("when a remote request a version with an higher major version than the host requested version, fallback to the highest requested version sharing the same major version as the host requested version", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", "2.0.0", true),
        createSharedEntry("remote-1", "3.1.0", true),
        createSharedEntry("remote-2", "2.1.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("3.1.0");
});

test.concurrent("supports \">\" range", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", ">2.0.0", true),
        createSharedEntry("remote-1", "3.1.0", true),
        createSharedEntry("remote-2", "2.1.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("3.1.0");
});

test.concurrent("supports \">=\" range", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", ">=2.0.0", true),
        createSharedEntry("remote-1", "3.1.0", true),
        createSharedEntry("remote-2", "2.1.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("3.1.0");
});

test.concurrent("supports \"> <\" range", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", ">2.0.0 <2.1.0", true),
        createSharedEntry("remote-1", "3.1.0", true),
        createSharedEntry("remote-2", "2.1.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("3.1.0");
});

test.concurrent("supports \"> <=\" range", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", ">2.0.0 <=2.1.0", true),
        createSharedEntry("remote-1", "3.1.0", true),
        createSharedEntry("remote-2", "2.1.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("3.1.0");
});

test.concurrent("supports \"^\" range", ({ expect }) => {
    const { resolvedEntry, highestVersionEntry } = resolveSharedDependency("my-lib", [
        createSharedEntry("host", "^2.0.0", true),
        createSharedEntry("remote-1", "3.1.0", true),
        createSharedEntry("remote-2", "2.1.0", true)
    ]);

    expect(resolvedEntry.version).toBe("2.1.0");
    expect(highestVersionEntry.version).toBe("3.1.0");
});
