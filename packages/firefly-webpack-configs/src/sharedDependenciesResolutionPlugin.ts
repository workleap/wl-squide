/*
This custom share dependency resolution strategy ensure that only the host app can ask for a new major version of a library.
Otherwise, any remote can request for an higher non-major version.

Examples:

host:        2.0
remote-1:    2.1   <-----
remote-2:    2.0

host:        2.0   <-----
remote-1:    3.1
remote-2:    2.0

host:        2.0
remote-1:    3.1
remote-2:    2.1   <-----

host:       >2.0
remote-1:    3.1
remote-2:    2.1   <-----
*/

import type { FederationHost, FederationRuntimePlugin } from "@module-federation/enhanced/runtime";
import { minVersion, parse, rcompare } from "semver";
import { HostApplicationName } from "./shared.ts";

type Shared = FederationHost["shareScopeMap"][string][string][string];

// Toggle to "true" to facilitate the debugging of this plugin.
const isDebug = false;

function log(...args: unknown[]) {
    if (isDebug) {
        console.log(...args);
    }
}

function findHighestVersionForMajor(entries: Shared[], major: number) {
    return entries.find(x => {
        return parse(x.version)!.major === major;
    })!;
}

interface ResolveSharedDependencyResult {
    resolvedEntry: Shared;
    highestVersionEntry: Shared;
}

// The return type is required otherwise we get the following error: error TS2742: The inferred type of 'resolveSharedDependency' cannot be named without a reference to.
export function resolveSharedDependency(pkgName: string, entries: Shared[], logFct: (...rest: unknown[]) => void = () => {}): ResolveSharedDependencyResult {
    const cleanedEntries = entries.map(x => ({
        ...x,
        // Removing any special characters like >,>=,^,~ etc...
        version: minVersion(x.version)!.version
    }));

    // From higher to lower versions.
    const sortedEntries = cleanedEntries.sort((x, y) => rcompare(x.version, y.version));

    logFct("[squide] Sorted the entries by version from higher to lower", sortedEntries);

    const highestVersionEntry = sortedEntries[0];

    logFct(`[squide] ${pkgName} highest requested version is`, highestVersionEntry.version, highestVersionEntry);

    // The host is always right!
    if (highestVersionEntry.from === HostApplicationName) {
        logFct("[squide] %cThis is the host version%c, great, resolving to:", "color: black; background-color: pink;", "", highestVersionEntry.version, highestVersionEntry);

        return {
            resolvedEntry: highestVersionEntry,
            highestVersionEntry: highestVersionEntry
        };
    }

    logFct(`[squide] ${pkgName} Highest requested version is not from the host.`);

    const hostEntry = sortedEntries.find(x => x.from === HostApplicationName);

    // Found nothing, that's odd but let's not break the app for this.
    if (!hostEntry) {
        logFct(`[squide] The host is not requesting any version of ${pkgName}, %caborting%c.`, "color: black; background-color: pink;", "");

        return {
            resolvedEntry: highestVersionEntry,
            highestVersionEntry: highestVersionEntry
        };
    }

    logFct(`[squide] ${pkgName} version requested by the host is:`, hostEntry.version, hostEntry);

    const parsedHighestVersion = parse(highestVersionEntry.version)!;
    const parsedHostVersion = parse(hostEntry.version)!;

    // Major versions should always be introduced by the host application.
    if (parsedHighestVersion.major === parsedHostVersion.major) {
        logFct(`[squide] Resolving to %c${parsedHighestVersion.major}%c.`, "color: black; background-color: pink;", "");

        return {
            resolvedEntry: highestVersionEntry,
            highestVersionEntry: highestVersionEntry
        };
    }

    logFct("[squide] The major number of the highest requested version is higher than the major number of the version requested by the host, looking for another version to resolve to.");

    // Start at the second entry since the first entry is the current higher version entry.
    // The result could either be the actual host entry or any other entry that is higher than the version requested
    // by the host, but match the host entry major version number.
    const fallbackEntry = findHighestVersionForMajor(sortedEntries.splice(1), parsedHostVersion.major);

    logFct(`[squide] The %chighest requested version%c for ${pkgName} that is in-range with the requested host major version number is:`, "color: black; background-color: pink;", "", fallbackEntry.version, fallbackEntry);

    return {
        resolvedEntry: fallbackEntry,
        highestVersionEntry: highestVersionEntry
    };
}

const plugin: () => FederationRuntimePlugin = () => {
    return {
        name: "shared-dependencies-resolution-plugin",
        resolveShare: function(args) {
            const { shareScopeMap, scope, pkgName } = args;

            log(`[squide] Resolving ${pkgName}:`, args);

            // This custom strategy only applies to singleton shared dependencies.
            const entries = Object.values(shareScopeMap[scope][pkgName]).filter(x => {
                return (
                    // Temporary check until all the remotes on Webpack Module Federation has been updated to Module Federation 2.0.
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    x.singleton ||
                    (x.shareConfig?.singleton)
                );
            });

            // Not a singleton dependency.
            if (entries.length === 0) {
                log(`[squide] ${pkgName} is not a singleton dependency, aborting.`);

                return args;
            }

            // If there's only one version entry, then it means that everyone is requesting the same version
            // of the dependency.
            if (entries.length <= 1) {
                log(`[squide] There's only one version requested for ${pkgName}, resolving to:`, entries[0].version, entries[0]);

                return args;
            }

            args.resolver = () => {
                log(`[squide] There's %cmore than one requested version%c for ${pkgName}:`, "color: black; background-color: pink;", "", entries.length, shareScopeMap[scope][pkgName]);

                const { resolvedEntry, highestVersionEntry } = resolveSharedDependency(pkgName, entries, log);

                if (resolvedEntry.version !== highestVersionEntry.version) {
                    console.log(`%c[squide] "${highestVersionEntry.from}" requested version "${highestVersionEntry.version}" of "${pkgName}". This version is higher than the major number of the version requested by the host for this dependency (${resolvedEntry.version}). The version for "${pkgName}" has been forced to "${resolvedEntry.version}".`, "color: white; background-color: red;");
                }

                return resolvedEntry;
            };

            return args;
        }
    };
};

export default plugin;
