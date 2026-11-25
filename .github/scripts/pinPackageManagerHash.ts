// Puts the integrity hash back on the root `packageManager` field after a dependency update.
//
//   node .github/scripts/pinPackageManagerHash.ts
//
// `pnpm update` moves the field to a newer pnpm version and writes it without a hash:
// `pnpm@12.21.0`. The hash is the one pnpm-lock.yaml records for that version, in hexadecimal
// instead of base64, so it is copied from there. A field that already carries a hash is left alone.
import { readFileSync, writeFileSync } from "node:fs";

const PACKAGE_MANAGER_FIELD = /("packageManager":\s*"pnpm@)([^"+]+)(")/;

export function findPnpmIntegrity(lockfile: string, version: string) {
    const [, integrity] = new RegExp(`^  pnpm@${RegExp.escape(version)}:\\r?\\n    resolution: \\{integrity: sha512-([A-Za-z0-9+/=]+)\\}`, "m").exec(lockfile) ?? [];

    return integrity ? Buffer.from(integrity, "base64").toString("hex") : undefined;
}

/**
 * Returns the package.json text with the hash added, or undefined when there is nothing to do:
 * the field already carries a hash, or doesn't name pnpm.
 */
export function pinPackageManagerHash(packageJson: string, lockfile: string) {
    const [, , version] = PACKAGE_MANAGER_FIELD.exec(packageJson) ?? [];
    if (!version) {
        return undefined;
    }

    const hash = findPnpmIntegrity(lockfile, version);
    if (!hash) {
        throw new Error(`pnpm-lock.yaml records no integrity for pnpm@${version}.`);
    }

    return packageJson.replace(PACKAGE_MANAGER_FIELD, `$1$2+sha512.${hash}$3`);
}

if (import.meta.main) {
    const pinned = pinPackageManagerHash(readFileSync("package.json", "utf8"), readFileSync("pnpm-lock.yaml", "utf8"));

    if (pinned) {
        writeFileSync("package.json", pinned);
        console.log("Added the integrity hash to the packageManager field.");
    } else {
        console.log("The packageManager field needs no hash.");
    }
}
