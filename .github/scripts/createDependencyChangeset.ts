// Writes the changeset of the weekly dependency update: a patch bump for every `@squide/*`
// package whose `dependencies` or `peerDependencies` differ between HEAD and the working tree.
//
//   node .github/scripts/createDependencyChangeset.ts
//
// A package where only `devDependencies` changed is left out: those never reach a consumer.
// Nothing is written when no package qualifies. The bump is always `patch`: whoever reviews
// the pull request raises it when a dependency change warrants more.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { readChangedPackageJsonRevisions, type PackageJsonRevisions } from "./summarizeDependencyChanges.ts";

const PUBLISHED_SCOPE = "@squide/";
const PUBLISHED_SECTIONS = ["dependencies", "peerDependencies"] as const;

export function listChangesetPackages(revisions: PackageJsonRevisions[]) {
    return revisions
        .filter(({ before, after }) => PUBLISHED_SECTIONS.some(section => !isDeepStrictEqual(before[section] ?? {}, after[section] ?? {})))
        .map(({ after }) => after.name)
        .filter((name): name is string => !!name && name.startsWith(PUBLISHED_SCOPE))
        .toSorted();
}

export function formatChangeset(packages: string[]) {
    return `---\n${packages.map(name => `"${name}": patch`).join("\n")}\n---\n\nUpdated dependencies to their latest versions.\n`;
}

// update-deps-<YYYYMMDD-HHMMSS>.md, in UTC, so two unreleased updates never share a file.
export function changesetFileName(now: Date) {
    const stamp = now
        .toISOString()
        .replace(/\.\d+Z$/, "")
        .replaceAll(/[-:]/g, "")
        .replace("T", "-");

    return `update-deps-${stamp}.md`;
}

if (import.meta.main) {
    const packages = listChangesetPackages(readChangedPackageJsonRevisions());

    if (packages.length === 0) {
        console.log("No changeset: no @squide/* package has a changed dependency or peer dependency.");
    } else {
        const path = join(".changeset", changesetFileName(new Date()));
        mkdirSync(".changeset", { recursive: true });
        writeFileSync(path, formatChangeset(packages));
        console.log(`Wrote ${path} for ${packages.join(", ")}.`);
    }
}
