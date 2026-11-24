// node --test .github/scripts/pinPackageManagerHash.test.ts
import { strictEqual, throws } from "node:assert/strict";
import { describe, it } from "node:test";
import { findPnpmIntegrity, pinPackageManagerHash } from "./pinPackageManagerHash.ts";

const HASH = "87327b6619853205834e4be59ba3a231e303d9f5e435912ede3312b7539b79af890942f6513b05a4690745666888045c09b33fc420c2cd2d3bd95c01ba21dbeb";

const LOCKFILE = `packages:

  '@pnpm/exe.linux-x64@12.19.0':
    resolution: {integrity: sha512-iaWidxR5B9NUBpwMznCQu1yUpKB6BjTY5BYX2lORj76VsfINdj8Z8XWSzSNrGI8qlxa28Jzdp5fiaspzOaJZlA==}

  pnpm@12.19.0:
    resolution: {integrity: sha512-hzJ7ZhmFMgWDTkvlm6OiMeMD2fXkNZEu3jMSt1Obea+JCUL2UTsFpGkHRWZoiARcCbM/xCDCzS072VwBuiHb6w==}
    engines: {node: '>=18'}

snapshots:

  pnpm@12.19.0:
    optionalDependencies:
      '@pnpm/exe.linux-x64': 12.19.0
`;

function packageJson(packageManager: string) {
    return `{\n    "name": "workspace-root",\n    "packageManager": "${packageManager}"\n}\n`;
}

void describe("findPnpmIntegrity", () => {
    void it("returns the integrity of the pnpm version, in hexadecimal", () => {
        strictEqual(findPnpmIntegrity(LOCKFILE, "12.19.0"), HASH);
    });

    void it("reads a lockfile with Windows line endings", () => {
        strictEqual(findPnpmIntegrity(LOCKFILE.replaceAll("\n", "\r\n"), "12.19.0"), HASH);
    });

    void it("returns undefined for a version the lockfile doesn't record", () => {
        strictEqual(findPnpmIntegrity(LOCKFILE, "12.21.0"), undefined);
    });

    void it("doesn't read the dots of the version as wildcards", () => {
        strictEqual(findPnpmIntegrity(LOCKFILE, "12x19x0"), undefined);
    });
});

void describe("pinPackageManagerHash", () => {
    void it("adds the hash to a field without one, and changes nothing else", () => {
        strictEqual(pinPackageManagerHash(packageJson("pnpm@12.19.0"), LOCKFILE), packageJson(`pnpm@12.19.0+sha512.${HASH}`));
    });

    void it("leaves a field that already carries a hash alone", () => {
        strictEqual(pinPackageManagerHash(packageJson(`pnpm@12.19.0+sha512.${HASH}`), LOCKFILE), undefined);
    });

    void it("leaves a field that doesn't name pnpm alone", () => {
        strictEqual(pinPackageManagerHash(packageJson("yarn@4.5.0"), LOCKFILE), undefined);
    });

    void it("leaves a package.json without the field alone", () => {
        strictEqual(pinPackageManagerHash(`{\n    "name": "workspace-root"\n}\n`, LOCKFILE), undefined);
    });

    void it("throws when the lockfile records no integrity for the version", () => {
        throws(() => pinPackageManagerHash(packageJson("pnpm@12.21.0"), LOCKFILE), /no integrity for pnpm@12\.21\.0/);
    });
});
