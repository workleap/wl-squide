// node --test .github/scripts/dependencyUpdate.test.ts
import { deepStrictEqual, strictEqual, throws } from "node:assert/strict";
import { describe, it } from "node:test";
import { changesetFileName, formatChangeset, listChangesetPackages } from "./createDependencyChangeset.ts";
import { findPnpmIntegrity, pinPackageManagerHash } from "./pinPackageManagerHash.ts";
import { listChangedPackageJsonFiles, summarizeDependencyChanges } from "./summarizeDependencyChanges.ts";

describe("listChangedPackageJsonFiles", () => {
    it("lists every package.json of a diff once, and nothing else", () => {
        const diff = [
            "diff --git a/package.json b/package.json",
            "--- a/package.json",
            "+++ b/package.json",
            "diff --git a/packages/core/package.json b/packages/core/package.json",
            "--- a/packages/core/package.json",
            "+++ b/packages/core/package.json",
            "diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml",
            "--- a/pnpm-lock.yaml",
            "+++ b/pnpm-lock.yaml"
        ].join("\n");

        deepStrictEqual(listChangedPackageJsonFiles(diff), ["package.json", "packages/core/package.json"]);
    });
});

describe("summarizeDependencyChanges", () => {
    it("lists a range that changed the same way in several files once, with every section", () => {
        const summary = summarizeDependencyChanges([
            { before: { peerDependencies: { react: "^19.0.0" } }, after: { peerDependencies: { react: "^19.1.0" } } },
            { before: { devDependencies: { react: "^19.0.0" } }, after: { devDependencies: { react: "^19.1.0" } } }
        ]);

        strictEqual(summary, "- `react`: `^19.0.0` → `^19.1.0` (peerDependencies, devDependencies) (range narrowed — may break consumers)");
    });

    it("puts peer dependencies first, then dependencies, then dev dependencies", () => {
        const summary = summarizeDependencyChanges([
            {
                before: { devDependencies: { vitest: "5.0.0" }, dependencies: { uuid: "11.0.0" }, peerDependencies: { msw: "^3.0.0" } },
                after: { devDependencies: { vitest: "5.1.0" }, dependencies: { uuid: "11.1.0" }, peerDependencies: { msw: "^3.0.0 || ^4.0.0" } }
            }
        ]);

        strictEqual(summary, ["- `msw`: `^3.0.0` → `^3.0.0 || ^4.0.0` (peerDependencies)", "- `uuid`: `11.0.0` → `11.1.0` (dependencies)", "- `vitest`: `5.0.0` → `5.1.0` (devDependencies)"].join("\n"));
    });

    it("flags a narrowed range for peer dependencies only", () => {
        const summary = summarizeDependencyChanges([{ before: { dependencies: { uuid: "^11.0.0" } }, after: { dependencies: { uuid: "^11.1.0" } } }]);

        strictEqual(summary, "- `uuid`: `^11.0.0` → `^11.1.0` (dependencies)");
    });

    it("shows an added or a removed dependency", () => {
        const summary = summarizeDependencyChanges([{ before: { dependencies: { old: "1.0.0" } }, after: { dependencies: { new: "2.0.0" } } }]);

        strictEqual(summary, ["- `new`: (none) → `2.0.0` (dependencies)", "- `old`: `1.0.0` → (none) (dependencies)"].join("\n"));
    });

    it("says so when no range changed", () => {
        strictEqual(summarizeDependencyChanges([{ before: { dependencies: { uuid: "11.0.0" } }, after: { dependencies: { uuid: "11.0.0" } } }]), "No dependency updates.");
    });
});

describe("listChangesetPackages", () => {
    it("keeps the @squide packages whose dependencies or peer dependencies changed", () => {
        const packages = listChangesetPackages([
            { before: { name: "@squide/msw", peerDependencies: { msw: "^3.0.0" } }, after: { name: "@squide/msw", peerDependencies: { msw: "^3.1.0" } } },
            { before: { name: "@squide/core", dependencies: { uuid: "11.0.0" } }, after: { name: "@squide/core", dependencies: { uuid: "11.1.0" } } }
        ]);

        deepStrictEqual(packages, ["@squide/core", "@squide/msw"]);
    });

    it("leaves out a package where only dev dependencies changed", () => {
        const packages = listChangesetPackages([
            {
                before: { name: "@squide/core", dependencies: { uuid: "11.0.0" }, devDependencies: { vitest: "5.0.0" } },
                after: { name: "@squide/core", dependencies: { uuid: "11.0.0" }, devDependencies: { vitest: "5.1.0" } }
            }
        ]);

        deepStrictEqual(packages, []);
    });

    it("leaves out the packages that are not published", () => {
        const packages = listChangesetPackages([
            { before: { name: "workspace-root", dependencies: { uuid: "11.0.0" } }, after: { name: "workspace-root", dependencies: { uuid: "11.1.0" } } },
            { before: { name: "@endpoints/host", dependencies: { uuid: "11.0.0" } }, after: { name: "@endpoints/host", dependencies: { uuid: "11.1.0" } } }
        ]);

        deepStrictEqual(packages, []);
    });
});

describe("formatChangeset", () => {
    it("writes a patch bump for every package", () => {
        strictEqual(formatChangeset(["@squide/core", "@squide/msw"]), '---\n"@squide/core": patch\n"@squide/msw": patch\n---\n\nUpdated dependencies to their latest versions.\n');
    });
});

describe("changesetFileName", () => {
    it("is stamped with the UTC date and time", () => {
        strictEqual(changesetFileName(new Date("2026-11-24T14:05:09.123Z")), "update-deps-20261124-140509.md");
    });
});

describe("pinPackageManagerHash", () => {
    // The pair pnpm 12.19.0 really has: the same 64 bytes, base64 in the lockfile and hexadecimal in package.json.
    const INTEGRITY = "hzJ7ZhmFMgWDTkvlm6OiMeMD2fXkNZEu3jMSt1Obea+JCUL2UTsFpGkHRWZoiARcCbM/xCDCzS072VwBuiHb6w==";
    const HASH = "87327b6619853205834e4be59ba3a231e303d9f5e435912ede3312b7539b79af890942f6513b05a4690745666888045c09b33fc420c2cd2d3bd95c01ba21dbeb";
    const LOCKFILE = ["packages:", "", "  '@pnpm/exe.linux-x64@12.19.0':", "    resolution: {integrity: sha512-AAAA}", "", "  pnpm@12.19.0:", `    resolution: {integrity: sha512-${INTEGRITY}}`, "    engines: {node: '>=18'}", ""].join("\n");

    it("reads the hash of a pnpm version from the lockfile", () => {
        strictEqual(findPnpmIntegrity(LOCKFILE, "12.19.0"), HASH);
        strictEqual(findPnpmIntegrity(LOCKFILE, "12.19.1"), undefined);
        strictEqual(findPnpmIntegrity(LOCKFILE.replaceAll("\n", "\r\n"), "12.19.0"), HASH);
    });

    it("adds the hash to a field that has none, and changes nothing else", () => {
        const packageJson = '{\n    "name": "workspace-root",\n    "packageManager": "pnpm@12.19.0"\n}\n';

        strictEqual(pinPackageManagerHash(packageJson, LOCKFILE), `{\n    "name": "workspace-root",\n    "packageManager": "pnpm@12.19.0+sha512.${HASH}"\n}\n`);
    });

    it("leaves a field that already carries a hash alone", () => {
        strictEqual(pinPackageManagerHash(`{ "packageManager": "pnpm@12.19.0+sha512.${HASH}" }`, LOCKFILE), undefined);
    });

    it("fails when the lockfile does not record the version", () => {
        throws(() => pinPackageManagerHash('{ "packageManager": "pnpm@12.21.0" }', LOCKFILE), /records no integrity for pnpm@12\.21\.0/);
    });
});
