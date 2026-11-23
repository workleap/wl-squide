// Prints the "Summary" section of the weekly dependency update pull request: every dependency
// range that differs between HEAD and the working tree, one line each.
//
//   node .github/scripts/summarizeDependencyChanges.ts
//
// A range that changed the same way in several package.json files is listed once, with every
// section it appears in. Peer dependencies come first, because they are the ones consumers see,
// and a peer range that no longer accepts everything it used to is flagged. Transitive
// dependencies (pnpm-lock.yaml only) are never listed.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import semver from "semver";

const DependencySections = ["peerDependencies", "dependencies", "devDependencies"] as const;

type DependencySection = (typeof DependencySections)[number];

export interface PackageJson extends Partial<Record<DependencySection, Record<string, string>>> {
    name?: string;
}

export interface PackageJsonRevisions {
    before: PackageJson;
    after: PackageJson;
}

interface DependencyChange {
    name: string;
    from: string | undefined;
    to: string | undefined;
    sections: Set<DependencySection>;
}

const DIFF_FILE_HEADER = /^(?:---|\+\+\+) [ab]\/(.+)$/;

export function listChangedPackageJsonFiles(diff: string) {
    const files = new Set<string>();

    for (const line of diff.split(/\r?\n/)) {
        const path = DIFF_FILE_HEADER.exec(line)?.[1];
        if (path && (path === "package.json" || path.endsWith("/package.json"))) {
            files.add(path);
        }
    }

    return [...files];
}

function collectDependencyChanges(revisions: PackageJsonRevisions[]) {
    const changes = new Map<string, DependencyChange>();

    for (const { before, after } of revisions) {
        for (const section of DependencySections) {
            const oldRanges = before[section] ?? {};
            const newRanges = after[section] ?? {};

            for (const name of new Set([...Object.keys(oldRanges), ...Object.keys(newRanges)])) {
                const from = oldRanges[name];
                const to = newRanges[name];
                if (from === to) {
                    continue;
                }

                const key = JSON.stringify([name, from, to]);
                const change = changes.get(key) ?? { name, from, to, sections: new Set() };
                change.sections.add(section);
                changes.set(key, change);
            }
        }
    }

    return [...changes.values()];
}

function sectionRank(change: DependencyChange) {
    return Math.min(...[...change.sections].map(section => DependencySections.indexOf(section)));
}

function isNarrowed(from: string, to: string) {
    if (!semver.validRange(from) || !semver.validRange(to)) {
        return false;
    }

    try {
        return !semver.subset(from, to);
    } catch {
        return false;
    }
}

function formatRange(range: string | undefined) {
    return range ? `\`${range}\`` : "(none)";
}

function formatChange(change: DependencyChange) {
    const sections = DependencySections.filter(section => change.sections.has(section));
    const narrowed = change.sections.has("peerDependencies") && !!change.from && !!change.to && isNarrowed(change.from, change.to);

    return `- \`${change.name}\`: ${formatRange(change.from)} → ${formatRange(change.to)} (${sections.join(", ")})${narrowed ? " (range narrowed — may break consumers)" : ""}`;
}

export function summarizeDependencyChanges(revisions: PackageJsonRevisions[]) {
    const changes = collectDependencyChanges(revisions).toSorted((a, b) => sectionRank(a) - sectionRank(b) || a.name.localeCompare(b.name) || (a.from ?? "").localeCompare(b.from ?? "") || (a.to ?? "").localeCompare(b.to ?? ""));

    return changes.length === 0 ? "No dependency updates." : changes.map(formatChange).join("\n");
}

function parsePackageJson(read: () => string): PackageJson {
    try {
        return JSON.parse(read()) as PackageJson;
    } catch {
        return {};
    }
}

function readRevisions(path: string): PackageJsonRevisions {
    return {
        before: parsePackageJson(() => execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })),
        after: parsePackageJson(() => readFileSync(path, "utf8"))
    };
}

// The revisions of every package.json that differs between HEAD and the working tree.
export function readChangedPackageJsonRevisions() {
    const diff = execFileSync("git", ["diff", "HEAD", "--", ":(glob)**/package.json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

    return listChangedPackageJsonFiles(diff).map(readRevisions);
}

if (import.meta.main) {
    console.log(summarizeDependencyChanges(readChangedPackageJsonRevisions()));
}
