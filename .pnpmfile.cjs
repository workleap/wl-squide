// Keeps every package download on the GitHub package firewall configured in .npmrc.
//
// The firewall proxies the npm registry, but the package metadata it serves still points each
// tarball at https://registry.npmjs.org/. pnpm would then download new packages from npmjs and
// write those npmjs URLs into pnpm-lock.yaml, so later installs would bypass the firewall too.
//
// - The fetcher downloads any npmjs tarball from the firewall instead.
// - The afterAllResolved hook removes the npmjs tarball URLs from the lockfile, so pnpm derives
//   them from the configured registry (the firewall) on install.
//
// pnpm-workspace.yaml also sets this file as the globalPnpmfile, so pnpm dlx / pnpx load it too.
// pnpm leaves a global pnpmfile out of the lockfile's pnpmfileChecksum, so after editing this file,
// run `pnpm install --fix-lockfile` to apply the change to pnpm-lock.yaml. See CONTRIBUTING.md.

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const NPMJS_REGISTRY = "https://registry.npmjs.org/";

const registryMatch = readFileSync(join(__dirname, ".npmrc"), "utf8").match(/^registry=(\S+)\s*$/m);

if (!registryMatch) {
    throw new Error("[.pnpmfile.cjs] Couldn't find the registry setting in the repository .npmrc file.");
}

const FIREWALL_REGISTRY = registryMatch[1].replace(/\/?$/, "/");

function isNpmjsTarball(resolution) {
    return typeof resolution?.tarball === "string" && resolution.tarball.startsWith(NPMJS_REGISTRY);
}

// The URL npmjs serves a package version's tarball from, e.g. @scope/name@1.0.0 ->
// https://registry.npmjs.org/@scope/name/-/name-1.0.0.tgz. Build metadata isn't part of the URL.
function getStandardNpmjsTarballUrl(name, version) {
    const unscopedName = name.slice(name.lastIndexOf("/") + 1);

    return `${NPMJS_REGISTRY}${name}/-/${unscopedName}-${version.replace(/\+.*$/, "")}.tgz`;
}

module.exports = {
    hooks: {
        afterAllResolved(lockfile) {
            for (const [key, pkg] of Object.entries(lockfile.packages ?? {})) {
                if (!isNpmjsTarball(pkg.resolution)) {
                    continue;
                }

                // Package keys are "<name>@<version>", where the name of a scoped package starts with "@".
                const separatorIndex = key.lastIndexOf("@");
                const name = key.slice(0, separatorIndex);
                const version = key.slice(separatorIndex + 1);

                // Only remove the URLs pnpm can derive from the registry. Any other URL stays, and the
                // lockfile check of the CI workflow reports it.
                if (separatorIndex > 0 && pkg.resolution.tarball === getStandardNpmjsTarballUrl(name, version)) {
                    delete pkg.resolution.tarball;
                }
            }

            return lockfile;
        }
    },
    fetchers: [
        {
            canFetch: (pkgId, resolution) => isNpmjsTarball(resolution),
            fetch: (cafs, resolution) => ({
                delegate: {
                    tarball: FIREWALL_REGISTRY + resolution.tarball.slice(NPMJS_REGISTRY.length),
                    integrity: resolution.integrity
                }
            })
        }
    ]
};
