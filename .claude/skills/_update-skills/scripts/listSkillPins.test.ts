// node --test .claude/skills/_update-skills/scripts/listSkillPins.test.ts
import { deepStrictEqual, match, strictEqual, throws } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
    blobSha,
    isUnchanged,
    listSkills,
    parseCliAnswer,
    parseFiles,
    parseLookup,
    parsePushes,
    parseRepository,
    pickCliVersion,
    pickUsableCliVersion,
    readInstalled,
    readPositions,
    servedReleases,
    skillFolder,
    Stop,
    tame,
    verifySkill,
    type GitHub,
    type LockEntry,
    type Push,
    type SkillsLock
} from "./listSkillPins.ts";

const NOW = new Date("2026-11-20T00:00:00.000Z");

void describe("pickCliVersion", () => {
    void it("picks the newest release at least 7 days old, the 7th day included", () => {
        strictEqual(pickCliVersion({ "1.8.0": "2026-11-10T18:32:23.422Z", "1.8.1": "2026-11-13T00:00:00.000Z", "1.8.2": "2026-11-13T00:00:00.001Z" }, NOW), "1.8.1");
    });

    void it("orders releases by number, not as text", () => {
        strictEqual(pickCliVersion({ "1.10.0": "2026-10-02T00:00:00.000Z", "1.9.0": "2026-10-01T00:00:00.000Z" }, NOW), "1.10.0");
    });

    void it("ignores prereleases and the registry's own timestamps", () => {
        strictEqual(pickCliVersion({ created: "2026-01-01T00:00:00.000Z", modified: "2026-11-01T00:00:00.000Z", "1.8.0": "2026-11-01T00:00:00.000Z", "1.9.0-snapshot.1": "2026-11-02T00:00:00.000Z" }, NOW), "1.8.0");
    });

    void it("offers nothing while only releases that can't pin a commit are old enough", () => {
        strictEqual(pickCliVersion({ "1.7.6": "2026-11-03T00:17:11.594Z", "1.8.0": "2026-11-19T00:00:00.000Z" }, NOW), undefined);
    });
});

void describe("servedReleases", () => {
    const publishedAt = { created: "2026-01-01T00:00:00.000Z", "1.8.0": "2026-11-01T00:00:00.000Z", "1.8.1": "2026-11-02T00:00:00.000Z", "1.9.0": "2026-11-03T00:00:00.000Z" };

    void it("drops a release the registry no longer serves, though it still tells when it was published", () => {
        deepStrictEqual(servedReleases(publishedAt, ["1.8.0", "1.9.0"], "1.9.0"), { "1.8.0": "2026-11-01T00:00:00.000Z", "1.9.0": "2026-11-03T00:00:00.000Z" });
    });

    void it("drops a release above the one the registry's latest tag names", () => {
        deepStrictEqual(Object.keys(servedReleases(publishedAt, ["1.8.0", "1.8.1", "1.9.0"], "1.8.1")), ["1.8.0", "1.8.1"]);
        deepStrictEqual(Object.keys(servedReleases({ "1.9.0": "2026-11-01T00:00:00.000Z", "1.10.0": "2026-11-02T00:00:00.000Z" }, ["1.9.0", "1.10.0"], "1.9.0")), ["1.9.0"]);
    });

    void it("offers nothing when the latest tag names no stable release", () => {
        for (const latest of ["", "2.0.0-beta.1", "latest"]) {
            deepStrictEqual(servedReleases(publishedAt, ["1.8.0", "1.8.1", "1.9.0"], latest), {});
        }
    });
});

void describe("pickUsableCliVersion", () => {
    const publishedAt = { "1.8.0": "2026-11-01T00:00:00.000Z", "1.8.1": "2026-11-02T00:00:00.000Z", "1.8.2": "2026-11-03T00:00:00.000Z" };
    const served = Object.keys(publishedAt);

    void it("skips a deprecated release for the one before it", () => {
        strictEqual(
            pickUsableCliVersion(publishedAt, served, "1.8.2", NOW, version => version !== "1.8.0"),
            "1.8.0"
        );
    });

    void it("skips a release the registry no longer serves without asking about it", () => {
        const asked: string[] = [];

        strictEqual(
            pickUsableCliVersion(publishedAt, ["1.8.0", "1.8.1"], "1.8.1", NOW, version => {
                asked.push(version);

                return false;
            }),
            "1.8.1"
        );
        deepStrictEqual(asked, ["1.8.1"]);
    });

    void it("never picks a release above the latest tag, however old", () => {
        strictEqual(
            pickUsableCliVersion(publishedAt, served, "1.8.1", NOW, () => false),
            "1.8.1"
        );
        strictEqual(
            pickUsableCliVersion(publishedAt, served, "1.7.6", NOW, () => false),
            undefined
        );
    });

    void it("offers nothing when every release old enough is deprecated", () => {
        strictEqual(
            pickUsableCliVersion(publishedAt, served, "1.8.2", NOW, () => true),
            undefined
        );
    });
});

function push(before: string, after: string, at: string): Push {
    return { before, after, at: Date.parse(at) };
}

void describe("readPositions", () => {
    void it("starts where the newest push at least 7 days old left the branch, the 7th day included", () => {
        const last = push("c", "d", "2026-11-19T00:00:00.000Z");
        const pushes = [last, push("b", "c", "2026-11-13T00:00:00.001Z"), push("a", "b", "2026-11-13T00:00:00.000Z"), push("0", "a", "2026-11-01T00:00:00.000Z")];

        deepStrictEqual(readPositions(pushes, NOW, last), ["b", "c", "d"]);
    });

    void it("holds every position in between, so content that was removed and pushed again is seen", () => {
        // "x" and "z" carry the same folder, "y" another: the two ends alone would look unchanged.
        const last = push("y", "z", "2026-11-19T23:50:00.000Z");
        const pushes = [last, push("x", "y", "2026-11-15T00:00:00.000Z"), push("w", "x", "2026-11-12T00:00:00.000Z")];

        deepStrictEqual(readPositions(pushes, NOW, last), ["x", "y", "z"]);
    });

    void it("holds what an unrecorded push brought in, and never takes it for the position 7 days ago", () => {
        // The push that moved the branch from "b" to "x" is missing from the record.
        const last = push("x", "d", "2026-11-19T00:00:00.000Z");

        deepStrictEqual(readPositions([last, push("a", "b", "2026-11-10T00:00:00.000Z")], NOW, last), ["b", "x", "d"]);
    });

    void it("is the head alone when the last push is 7 days old", () => {
        const last = push("a", "b", "2026-11-13T00:00:00.000Z");

        deepStrictEqual(readPositions([last], NOW, last), ["b"]);
    });

    void it("goes by the time of each push, not by the order they are listed in", () => {
        const last = push("c", "d", "2026-11-19T00:00:00.000Z");
        const pushes = [push("a", "b", "2026-11-10T00:00:00.000Z"), last, push("0", "a", "2026-11-01T00:00:00.000Z"), push("b", "c", "2026-11-15T00:00:00.000Z")];

        deepStrictEqual(readPositions(pushes, NOW, last)?.toSorted(), ["b", "c", "d"]);
    });

    void it("counts a push whose time can't be read as recent", () => {
        // Nothing but that push tells of "x" and "y".
        const last = push("c", "d", "2026-11-19T00:00:00.000Z");

        deepStrictEqual(readPositions([last, push("x", "y", "not a date"), push("a", "b", "2026-11-10T00:00:00.000Z")], NOW, last), ["b", "c", "d", "x", "y"]);
    });

    void it("answers nothing when no listed push is 7 days old", () => {
        const last = push("b", "c", "2026-11-19T00:00:00.000Z");

        strictEqual(readPositions([last, push("a", "b", "2026-11-18T00:00:00.000Z")], NOW, last), undefined);
        strictEqual(readPositions([last], NOW, last), undefined);
    });

    void it("answers nothing from a listing that misses the last push", () => {
        const last = push("c", "d", "2026-11-19T00:00:00.000Z");
        const old = push("a", "b", "2026-11-10T00:00:00.000Z");

        strictEqual(readPositions([old], NOW, last), undefined);
        strictEqual(readPositions([push("c", "d", "2026-11-18T00:00:00.000Z"), old], NOW, last), undefined);
        strictEqual(readPositions([push("c", "e", "2026-11-19T00:00:00.000Z"), old], NOW, last), undefined);
        strictEqual(readPositions([], NOW, last), undefined);
    });
});

const TREE = "a".repeat(40);
const OTHER = "b".repeat(40);
const position = (index: number) => index.toString(16).padStart(40, "0");

// A lookup that finds TREE everywhere but at `changed`, and records how many positions each request asked.
function lookupWith(changed: string[], requests: number[] = []) {
    return (commits: string[]) => {
        requests.push(commits.length);

        return commits.map(commit => (changed.includes(commit) ? OTHER : TREE));
    };
}

void describe("isUnchanged", () => {
    void it("asks about every position, a hundred at a time", () => {
        for (const [count, expected] of [
            [0, []],
            [1, [1]],
            [100, [100]],
            [101, [100, 1]],
            [250, [100, 100, 50]]
        ] as const) {
            const requests: number[] = [];

            strictEqual(
                isUnchanged(
                    Array.from({ length: count }, (_unused, index) => position(index)),
                    TREE,
                    lookupWith([], requests)
                ),
                true
            );
            deepStrictEqual(requests, expected);
        }
    });

    void it("sees a change at any position, the edges of a request included", () => {
        const positions = Array.from({ length: 250 }, (_unused, index) => position(index));

        for (const index of [0, 99, 100, 199, 200, 249]) {
            strictEqual(isUnchanged(positions, TREE, lookupWith([position(index)])), false);
        }
    });

    void it("takes a position where nothing is found as a change", () => {
        strictEqual(
            isUnchanged([position(1), position(2)], TREE, commits => commits.map(commit => (commit === position(2) ? null : TREE))),
            false
        );
    });

    void it("refuses a position that isn't a full commit sha without asking", () => {
        for (const odd of ["", "main", "abc1234", position(1).toUpperCase().replace("0", "A")]) {
            const requests: number[] = [];

            strictEqual(isUnchanged([position(1), odd], TREE, lookupWith([], requests)), false);
            deepStrictEqual(requests, []);
        }
    });
});

// What `gh` prints for each request, as recorded from GitHub.
void describe("what gh answers", () => {
    void it("reads a source's id, name and default branch", () => {
        deepStrictEqual(parseRepository('[413918947,"vercel/turborepo","main"]'), { id: 413918947, fullName: "vercel/turborepo", defaultBranch: "main" });
    });

    void it("reads an answer that lacks one of them as a value no source is recorded with", () => {
        deepStrictEqual(parseRepository("[null,null,null]"), { id: Number.NaN, fullName: "", defaultBranch: "" });
        deepStrictEqual(parseRepository('["413918947",7,["main"]]'), { id: Number.NaN, fullName: "", defaultBranch: "" });
    });

    void it("reads pushes with the end each took the branch from and to", () => {
        const output = ['["9c5b2ad2e3d7a13e6e4b8c8e2d5a3f1b7c9d0e1f","1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e","2026-11-12T15:04:05Z"]', '["0000000000000000000000000000000000000000","9c5b2ad2e3d7a13e6e4b8c8e2d5a3f1b7c9d0e1f","2026-11-01T08:00:00Z"]'].join("\n");

        deepStrictEqual(parsePushes(output), [
            { before: "9c5b2ad2e3d7a13e6e4b8c8e2d5a3f1b7c9d0e1f", after: "1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e", at: Date.parse("2026-11-12T15:04:05Z") },
            { before: "0000000000000000000000000000000000000000", after: "9c5b2ad2e3d7a13e6e4b8c8e2d5a3f1b7c9d0e1f", at: Date.parse("2026-11-01T08:00:00Z") }
        ]);
        deepStrictEqual(parsePushes(""), []);
    });

    void it("reads a push with an end or a time missing as one that is never old enough or a commit", () => {
        deepStrictEqual(parsePushes('[null,7,null]\r\n["a","b","soon"]\n'), [
            { before: "", after: "", at: Number.NaN },
            { before: "a", after: "b", at: Number.NaN }
        ]);
    });

    void it("reads each position's line of a lookup, in whatever order they come", () => {
        deepStrictEqual(parseLookup(`p1 ${OTHER}\np0 ${TREE}\n`, 2), [TREE, OTHER]);
        deepStrictEqual(parseLookup(`p0 ${TREE}\r\np1 ${OTHER}\r\n`, 2), [TREE, OTHER]);
    });

    void it("answers null for a position with no line or no oid", () => {
        deepStrictEqual(parseLookup(`p0 ${TREE}\np1 \n`, 3), [TREE, null, null]);
        deepStrictEqual(parseLookup("", 2), [null, null]);
        deepStrictEqual(parseLookup(`p0${TREE}\nnonsense\n`, 1), [null]);
    });

    void it("reads the files of a folder, a path with spaces included", () => {
        deepStrictEqual(parseFiles(`false\n${TREE} SKILL.md\n${OTHER} references/how to.md\n`), { "SKILL.md": TREE, "references/how to.md": OTHER });
        deepStrictEqual(parseFiles("false"), {});
    });

    void it("reads no files from a listing GitHub cut short, or one that doesn't say", () => {
        strictEqual(parseFiles(`true\n${TREE} SKILL.md\n`), undefined);
        strictEqual(parseFiles(`${TREE} SKILL.md\n`), undefined);
        strictEqual(parseFiles(""), undefined);
    });
});

const DAY = 24 * 60 * 60 * 1000;
const SOURCE = "upstream/skills";
const SOURCES = { [SOURCE]: { id: 7, branch: "main" } };
const PINNED = position(900);
const DEMO: LockEntry = { source: SOURCE, sourceType: "github", ref: PINNED, skillPath: "skills/demo/SKILL.md" };
const LOCK: SkillsLock = { skills: { demo: DEMO } };
// Commits of the upstream branch, oldest first.
const [P, X, Q, R, Y, Z] = [position(1), position(2), position(3), position(4), position(5), position(6)] as const;

function pushed(before: string, after: string, daysAgo: number): Push {
    return { before, after, at: NOW.getTime() - daysAgo * DAY };
}

interface Upstream {
    source?: string;
    id?: number;
    fullName?: string;
    branch?: string;
    // The folder the trees below are of.
    path?: string;
    // The tree of that folder at each commit that has one.
    folder: Record<string, string>;
    // The pushes GitHub recorded, newest first.
    pushes: Push[];
    // What a period's listing answers, when it lags behind that record.
    listed?: Push[];
    // Where the branch points, when it isn't where the last recorded push left it.
    ref?: string;
    // What GitHub answers as the newest commit that changed the folder.
    latest: string;
}

// GitHub answering from memory for one source and one of its folders, recording what it was asked
// in `asked`. Asked about another source it fails the test; about another folder it has nothing.
function upstream({ source = SOURCE, id = 7, fullName = source, branch = "main", path = "skills/demo", folder, pushes, listed = pushes, ref, latest }: Upstream, asked: string[] = []): GitHub {
    const treeAt = (commit: string, asking: string) => (asking === path ? folder[commit] : undefined);

    return {
        repository: asking => {
            strictEqual(asking, source);
            asked.push("repository");

            return { id, fullName, defaultBranch: branch };
        },
        pushes: (asking, ofBranch, period) => {
            strictEqual(asking, source);
            strictEqual(ofBranch, "main");
            asked.push(`pushes of the ${period ?? "last push"}`);

            return period ? listed.filter(recorded => recorded.at > NOW.getTime() - (period === "month" ? 30 : 365) * DAY) : pushes.slice(0, 1);
        },
        ref: (asking, ofBranch) => {
            strictEqual(asking, source);
            strictEqual(ofBranch, "main");

            return ref ?? pushes[0]?.after ?? "";
        },
        // The real one stops when there is none.
        folderTree: (asking, commit, asking2) => {
            strictEqual(asking, source);

            const tree = treeAt(commit, asking2);

            if (!tree) {
                throw new Stop(`no ${asking2} at ${commit}`);
            }

            return tree;
        },
        folderTrees: (asking, commits, asking2) => {
            strictEqual(asking, source);
            asked.push(`${commits.length} lookups`);

            return commits.map(commit => treeAt(commit, asking2) ?? null);
        },
        latestCommit: (asking, head, asking2) => {
            strictEqual(asking, source);
            strictEqual(head, pushes[0]?.after);
            strictEqual(asking2, path);

            return latest;
        },
        files: () => {
            throw new Error("the listing never lists files");
        }
    };
}

// GitHub answering for several sources, each from its own memory.
function route(sources: Record<string, GitHub>): GitHub {
    const of = (source: string) => sources[source] ?? upstream({ source: "nobody/asked", folder: {}, pushes: [], latest: "" });

    return {
        repository: source => of(source).repository(source),
        pushes: (source, ...rest) => of(source).pushes(source, ...rest),
        ref: (source, ...rest) => of(source).ref(source, ...rest),
        folderTree: (source, ...rest) => of(source).folderTree(source, ...rest),
        folderTrees: (source, ...rest) => of(source).folderTrees(source, ...rest),
        latestCommit: (source, ...rest) => of(source).latestCommit(source, ...rest),
        files: (source, ...rest) => of(source).files(source, ...rest)
    };
}

const settledAt = (latest: string) => [{ skill: "demo", source: SOURCE, pinned: PINNED, latest, settled: true, problem: null }];
const WAITING = [{ skill: "demo", source: SOURCE, pinned: PINNED, latest: null, settled: false, problem: null }];
// The folder was set by X, pushed 8 days ago.
const OLD_PUSHES = [pushed(P, X, 8), pushed("0".repeat(40), P, 40)];
const FINE = { folder: { [X]: TREE }, pushes: OLD_PUSHES, latest: X };

// The one skill of LOCK, which must be listed with a problem and nothing to install.
function problemOf(github: GitHub, sources: Record<string, { id: number; branch: string }> = SOURCES) {
    const [listed, ...rest] = listSkills(LOCK, github, NOW, sources, []);

    deepStrictEqual(rest, []);
    deepStrictEqual({ ...listed, problem: null }, { skill: "demo", source: SOURCE, pinned: PINNED, latest: null, settled: false, problem: null });

    return listed?.problem ?? "";
}

void describe("listSkills", () => {
    void it("settles a folder on a branch nobody pushed to this week, from its last push alone", () => {
        const asked: string[] = [];

        deepStrictEqual(listSkills(LOCK, upstream(FINE, asked), NOW, SOURCES, []), settledAt(X));
        deepStrictEqual(asked, ["repository", "pushes of the last push"]);
    });

    void it("settles a folder that this week's pushes left alone", () => {
        const pushes = [pushed(Q, R, 1), pushed(X, Q, 3), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE, [R]: TREE }, pushes, latest: X }), NOW, SOURCES, []), settledAt(X));
    });

    void it("waits after a change inside the 7 days", () => {
        const pushes = [pushed(Q, R, 3), pushed(X, Q, 5), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE, [R]: OTHER }, pushes, latest: R }), NOW, SOURCES, []), WAITING);
    });

    void it("waits when the folder was changed and restored inside the 7 days", () => {
        // X and Z hold the same folder, Y another: now and 7 days ago look the same.
        const pushes = [pushed(Y, Z, 0.01), pushed(X, Y, 5), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Y]: OTHER, [Z]: TREE }, pushes, latest: Z }), NOW, SOURCES, []), WAITING);
    });

    void it("waits when it was changed by a push GitHub never recorded", () => {
        const pushes = [pushed(Y, Z, 0.01), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Y]: OTHER, [Z]: TREE }, pushes, latest: Z }), NOW, SOURCES, []), WAITING);
    });

    void it("waits when the branch has moved on from its last recorded push, and the folder with it", () => {
        deepStrictEqual(listSkills(LOCK, upstream({ ...FINE, folder: { [X]: TREE, [Y]: OTHER }, ref: Y }), NOW, SOURCES, []), WAITING);
    });

    void it("settles when the branch has moved on but the folder hasn't", () => {
        deepStrictEqual(listSkills(LOCK, upstream({ ...FINE, folder: { [X]: TREE, [Q]: TREE }, ref: Q }), NOW, SOURCES, []), settledAt(X));
    });

    void it("waits when a position of the week no longer exists", () => {
        const pushes = [pushed(Y, Q, 1), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, latest: X }), NOW, SOURCES, []), WAITING);
    });

    void it("looks in the year when the month holds no push old enough", () => {
        const asked: string[] = [];
        const pushes = [pushed(X, Q, 2), pushed(P, X, 60)];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, latest: X }, asked), NOW, SOURCES, []), settledAt(X));
        deepStrictEqual(asked, ["repository", "pushes of the last push", "pushes of the month", "pushes of the year", "1 lookups"]);
    });

    void it("waits on a branch whose record doesn't reach back 7 days", () => {
        const pushes = [pushed(X, Q, 1), pushed("0".repeat(40), X, 2)];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, latest: X }), NOW, SOURCES, []), WAITING);
    });

    void it("waits when a period's listing misses the last push, whatever else it holds", () => {
        const pushes = [pushed(X, Q, 1), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, listed: OLD_PUSHES, latest: X }), NOW, SOURCES, []), WAITING);
    });

    void it("lists a skill whose lock entry isn't what the CLI writes with a problem, not a crash", () => {
        const odd: SkillsLock = JSON.parse('{ "skills": { "demo": { "source": "upstream/skills", "sourceType": "github", "skillPath": 7 } } }');

        match(listSkills(odd, upstream(FINE), NOW, SOURCES, [])[0]?.problem ?? "", /not recorded in skills-lock\.json as a folder of a GitHub repository/);
    });

    void it("sees a change past the first hundred positions of a busy week", () => {
        const commits = Array.from({ length: 150 }, (_unused, index) => position(1000 + index));
        const pushes = [...commits.map((commit, index) => pushed(commits[index - 1] ?? X, commit, (150 - index) / 1000)).toReversed(), ...OLD_PUSHES];
        const unchanged = Object.fromEntries([X, ...commits].map(commit => [commit, TREE]));
        const asked: string[] = [];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: unchanged, pushes, latest: X }, asked), NOW, SOURCES, []), settledAt(X));
        deepStrictEqual(asked.slice(-2), ["100 lookups", "50 lookups"]);
        deepStrictEqual(listSkills(LOCK, upstream({ folder: { ...unchanged, [position(1120)]: OTHER }, pushes, latest: X }), NOW, SOURCES, []), WAITING);
    });

    void it("reads a source once for all its skills", () => {
        const asked: string[] = [];
        const lock: SkillsLock = { skills: { demo: DEMO, again: { ...DEMO, ref: undefined } } };
        const listing = listSkills(lock, upstream(FINE, asked), NOW, SOURCES, []);

        deepStrictEqual(
            listing.map(skill => [skill.skill, skill.pinned, skill.settled]),
            [
                ["demo", PINNED, true],
                ["again", null, true]
            ]
        );
        deepStrictEqual(asked, ["repository", "pushes of the last push"]);
    });

    void it("reads each skill from its own folder of its own source", () => {
        const elsewhere = "elsewhere/kit";
        const lock: SkillsLock = {
            skills: {
                demo: DEMO,
                // Same source, another folder: left alone, where demo's changed 3 days ago.
                other: { source: SOURCE, sourceType: "github", skillPath: "skills/other/SKILL.md" },
                // Another source, on another branch position, with a folder of the same path.
                kit: { source: elsewhere, sourceType: "github", skillPath: "skills/demo/SKILL.md" }
            }
        };
        const pushes = [pushed(X, Q, 3), ...OLD_PUSHES];
        const demo = upstream({ folder: { [X]: TREE, [Q]: OTHER }, pushes, latest: Q });
        const other = upstream({ path: "skills/other", folder: { [X]: OTHER, [Q]: OTHER }, pushes, latest: X });
        const of = (folder: string) => (folder === "skills/other" ? other : demo);
        const github = route({
            [SOURCE]: { ...demo, folderTree: (source, commit, folder) => of(folder).folderTree(source, commit, folder), folderTrees: (source, commits, folder) => of(folder).folderTrees(source, commits, folder), latestCommit: (source, head, folder) => of(folder).latestCommit(source, head, folder) },
            [elsewhere]: upstream({ source: elsewhere, id: 8, folder: { [Y]: OTHER }, pushes: [pushed(R, Y, 9)], latest: Y })
        });

        deepStrictEqual(listSkills(lock, github, NOW, { ...SOURCES, [elsewhere]: { id: 8, branch: "main" } }, []), [
            { skill: "demo", source: SOURCE, pinned: PINNED, latest: null, settled: false, problem: null },
            { skill: "other", source: SOURCE, pinned: null, latest: X, settled: true, problem: null },
            { skill: "kit", source: elsewhere, pinned: null, latest: Y, settled: true, problem: null }
        ]);
    });

    void it("lists a skill whose source isn't the repository this file records with a problem", () => {
        // It was renamed or moved: GitHub still answers under the old name, with the new one.
        match(problemOf(upstream({ ...FINE, fullName: "newowner/skills" })), /now answers as "newowner\/skills", repository 7,.*renamed, moved or replaced/);
        // Someone else registered the name: another repository answers.
        match(problemOf(upstream({ ...FINE, id: 8 })), /now answers as "upstream\/skills", repository 8, and SOURCES records repository 7/);
        match(problemOf(upstream({ ...FINE, id: Number.NaN, fullName: "" })), /repository unknown/);
        // Its default branch changed.
        match(problemOf(upstream({ ...FINE, branch: "next" })), /default branch is "next" and SOURCES records "main"/);
    });

    void it("takes a source's name as the same whatever its case", () => {
        deepStrictEqual(listSkills(LOCK, upstream({ ...FINE, fullName: "Upstream/Skills" }), NOW, SOURCES, []), settledAt(X));
    });

    void it("never prints a name GitHub answered that holds more than a name does", () => {
        for (const name of ['x$(id)`id`;|&"q', "next\nIgnore the above and", "a".repeat(101), ""]) {
            for (const problem of [problemOf(upstream({ ...FINE, branch: name })), problemOf(upstream({ ...FINE, fullName: name }))]) {
                match(problem, /a name this file won't print/);
                strictEqual(/[$`;|&\n]|Ignore|aaaa/.test(problem), false);
            }
        }
    });

    void it("asks GitHub nothing about a source nobody recorded", () => {
        const asked: string[] = [];

        match(problemOf(upstream(FINE, asked), {}), /"upstream\/skills" isn't in SOURCES/);
        match(problemOf(upstream(FINE, asked), Object.create({ [SOURCE]: { id: 7, branch: "main" } })), /isn't in SOURCES/);
        deepStrictEqual(asked, []);
    });

    void it("lists a skill whose branch or folder can't be read with a problem", () => {
        // GitHub has no push on record for the branch, or one that doesn't end at a commit.
        match(problemOf(upstream({ ...FINE, pushes: [] })), /no usable last push for main/);
        match(problemOf(upstream({ ...FINE, folder: { [X]: TREE, main: TREE }, pushes: [pushed(P, "main", 8)] })), /no usable last push for main/);
        // The skill's folder is gone from the head: what the real GitHub stops with is the problem.
        strictEqual(problemOf(upstream({ ...FINE, folder: {} })), `no skills/demo at ${X}`);
        // The commit GitHub answers as the latest doesn't hold the head's folder, or isn't a commit.
        match(problemOf(upstream({ ...FINE, folder: { [X]: TREE, [P]: OTHER }, latest: P })), /isn't the folder the branch head holds/);
        match(problemOf(upstream({ ...FINE, folder: { [X]: TREE, main: TREE }, latest: "main" })), /no commit for the latest commit/);
    });

    void it("lists the other skills all the same, and asks a source that can't be read only once", () => {
        const renamed = "renamed/kit";
        const asked: string[] = [];
        const lock: SkillsLock = {
            skills: {
                gone: { source: SOURCE, sourceType: "github", skillPath: "skills/gone/SKILL.md" },
                kit: { source: renamed, sourceType: "github", skillPath: "skills/demo/SKILL.md" },
                demo: DEMO,
                kit2: { source: renamed, sourceType: "github", skillPath: "skills/demo/SKILL.md" }
            }
        };
        const github = route({ [SOURCE]: upstream(FINE), [renamed]: upstream({ ...FINE, source: renamed, fullName: "new/kit" }, asked) });
        const listing = listSkills(lock, github, NOW, { ...SOURCES, [renamed]: { id: 7, branch: "main" } }, []);

        deepStrictEqual(
            listing.map(skill => [skill.skill, skill.settled, skill.latest, skill.problem === null]),
            [
                ["gone", false, null, false],
                ["kit", false, null, false],
                ["demo", true, X, true],
                ["kit2", false, null, false]
            ]
        );
        strictEqual(listing[1]?.problem, listing[3]?.problem);
        deepStrictEqual(asked, ["repository"]);
    });

    void it("lets anything but a stop through as the crash it is", () => {
        const broken: GitHub = {
            ...upstream(FINE),
            repository: () => {
                throw new TypeError("not a stop");
            }
        };

        throws(() => listSkills(LOCK, broken, NOW, SOURCES, []), TypeError);
        throws(
            () =>
                listSkills(
                    LOCK,
                    {
                        ...upstream(FINE),
                        folderTree: () => {
                            throw new TypeError("not a stop");
                        }
                    },
                    NOW,
                    SOURCES,
                    []
                ),
            TypeError
        );
    });

    void it("lists a skill that isn't a GitHub folder with nothing to compare when it is named, and with a problem when it isn't", () => {
        const asked: string[] = [];
        const site: LockEntry = { source: "docs.example.com", sourceType: "well-known" };
        const lock: SkillsLock = { skills: { site, demo: DEMO } };

        deepStrictEqual(listSkills(lock, upstream(FINE, asked), NOW, SOURCES, ["site"]), [{ skill: "site", source: "docs.example.com", pinned: null, latest: null, settled: null, problem: null }, ...settledAt(X)]);

        const [unnamed] = listSkills(lock, upstream(FINE, asked), NOW, SOURCES, []);

        deepStrictEqual({ ...unnamed, problem: null }, { skill: "site", source: "docs.example.com", pinned: null, latest: null, settled: false, problem: null });
        match(unnamed?.problem ?? "", /not recorded in skills-lock\.json as a folder of a GitHub repository \(sourceType "well-known", skillPath undefined\)/);
        // Neither asked GitHub anything about it: every question was about demo's source.
        deepStrictEqual(asked, ["repository", "pushes of the last push", "repository", "pushes of the last push"]);
    });

    void it("keeps the cooldown of a GitHub skill, even one that is named as having none", () => {
        const pushes = [pushed(X, Q, 3), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: OTHER }, pushes, latest: Q }), NOW, SOURCES, ["demo"]), WAITING);
    });
});

void describe("skillFolder", () => {
    void it("is the folder that holds the skill's SKILL.md", () => {
        strictEqual(skillFolder(DEMO), "skills/demo");
        strictEqual(skillFolder({ ...DEMO, skillPath: "a/b/c/SKILL.md" }), "a/b/c");
    });

    void it("is nothing for an entry that isn't a folder inside a GitHub repository", () => {
        for (const skillPath of [undefined, "", "SKILL.md", "/SKILL.md", "./SKILL.md", "../other/SKILL.md", "skills/../../other/SKILL.md", "skills//demo/SKILL.md", "skills\\demo\\SKILL.md", "skills/de\\mo/SKILL.md", "skills/./demo/SKILL.md"]) {
            strictEqual(skillFolder({ ...DEMO, skillPath }), undefined);
        }

        strictEqual(skillFolder({ ...DEMO, sourceType: "well-known" }), undefined);
    });
});

void describe("verifySkill", () => {
    const [README, GUIDE, EXTRA] = [position(11), position(12), position(13)] as const;

    // GitHub holding the pinned folder's files, and nothing else.
    function holding(files: Record<string, string>): GitHub {
        return {
            ...upstream(FINE),
            files: (source, commit, folder) => {
                deepStrictEqual([source, commit, folder], [SOURCE, PINNED, "skills/demo"]);

                return files;
            }
        };
    }

    const UPSTREAM = { "SKILL.md": README, "references/guide.md": GUIDE, "metadata.json": EXTRA };

    void it("verifies an install whose every file is a file of the pinned folder", () => {
        deepStrictEqual(verifySkill(LOCK, holding(UPSTREAM), "demo", { "SKILL.md": [README, OTHER], "references/guide.md": [OTHER, GUIDE] }), { skill: "demo", source: SOURCE, ref: PINNED, verified: true, unlike: [] });
    });

    void it("names every file the pinned folder doesn't hold with that content", () => {
        // A file with other content, one the folder doesn't hold, two that match nothing, one with a name not to print.
        const installed = { "SKILL.md": [OTHER, TREE], "references/guide.md": [GUIDE], "scripts/added.sh": [README], link: [], "metadata.json": [], "x\u0060$(id)\u0060.md": [README] };

        deepStrictEqual(verifySkill(LOCK, holding(UPSTREAM), "demo", installed), { skill: "demo", source: SOURCE, ref: PINNED, verified: false, unlike: ["SKILL.md", "a file whose name this file won't print", "link", "metadata.json", "scripts/added.sh"] });
        // A file the folder holds only by inheritance isn't one it holds.
        strictEqual(verifySkill(LOCK, holding(Object.create({ "SKILL.md": README })), "demo", { "SKILL.md": [README] }).verified, false);
    });

    void it("doesn't verify a skill with nothing installed", () => {
        strictEqual(verifySkill(LOCK, holding(UPSTREAM), "demo", {}).verified, false);
    });

    void it("stops for a skill the lock doesn't pin to a commit of a GitHub folder", () => {
        const installed = { "SKILL.md": [README] };
        const locked = (entry: LockEntry): SkillsLock => ({ skills: { demo: entry } });

        throws(() => verifySkill(LOCK, holding(UPSTREAM), "other", installed), Stop);
        throws(() => verifySkill(LOCK, holding(UPSTREAM), "toString", installed), Stop);
        throws(() => verifySkill(locked({ ...DEMO, ref: undefined }), holding(UPSTREAM), "demo", installed), Stop);
        throws(() => verifySkill(locked({ ...DEMO, ref: "main" }), holding(UPSTREAM), "demo", installed), Stop);
        throws(() => verifySkill(locked({ ...DEMO, skillPath: "SKILL.md" }), holding(UPSTREAM), "demo", installed), Stop);
        throws(() => verifySkill(locked({ ...DEMO, sourceType: "well-known" }), holding(UPSTREAM), "demo", installed), Stop);
    });

    void it("hashes a file the way git does", () => {
        strictEqual(blobSha(Buffer.from("")), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
        strictEqual(blobSha(Buffer.from("hello\n")), "ce013625030ba8dba906f756967f9e9ca394464a");
    });
});

void describe("parseCliAnswer", () => {
    // What `pnpm view skills time versions dist-tags --json` printed, shortened.
    const answer = {
        time: { created: "2025-10-14T19:01:04.221Z", modified: "2026-11-12T09:00:00.000Z", "1.7.6": "2026-11-03T00:17:11.594Z", "1.8.0": "2026-11-10T18:32:23.422Z", "1.8.1": "2026-11-12T09:00:00.000Z" },
        versions: ["1.7.6", "1.8.0", "1.8.1"],
        "dist-tags": { latest: "1.8.1", snapshot: "1.5.23-snapshot.2" }
    };

    void it("reads the publish times, the served releases and the latest tag", () => {
        const { publishedAt, served, latest } = parseCliAnswer(JSON.stringify(answer));

        deepStrictEqual([publishedAt, served, latest], [answer.time, answer.versions, "1.8.1"]);
        strictEqual(
            pickUsableCliVersion(publishedAt, served, latest, NOW, () => false),
            "1.8.1"
        );
    });

    void it("reads a single served release, which pnpm prints as text", () => {
        deepStrictEqual(parseCliAnswer(JSON.stringify({ ...answer, versions: "1.8.0" })).served, ["1.8.0"]);
    });

    void it("reads an answer that lacks a part as offering nothing", () => {
        deepStrictEqual(parseCliAnswer("{}"), { publishedAt: {}, served: [], latest: "" });
        strictEqual(parseCliAnswer(JSON.stringify({ ...answer, "dist-tags": { latest: 7 } })).latest, "");
    });
});

void describe("readInstalled", () => {
    // A folder of installed skills, removed once `check` has run.
    function installed(files: Record<string, string>, check: (root: string) => void) {
        const root = mkdtempSync(join(tmpdir(), "installed-skills-"));

        try {
            for (const [file, content] of Object.entries(files)) {
                mkdirSync(dirname(join(root, file)), { recursive: true });
                writeFileSync(join(root, file), content);
            }

            check(root);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    }

    const sha = (text: string) => blobSha(Buffer.from(text));

    void it("reads every file of the skill and of no other, by its path inside the folder", () => {
        installed({ "demo/SKILL.md": "a\nb\n", "demo/references/deep/guide.md": "g\n", "demo/empty": "", "other/SKILL.md": "x" }, root => {
            deepStrictEqual(readInstalled("demo", root), {
                "SKILL.md": [sha("a\nb\n"), sha("a\nb\n")],
                "references/deep/guide.md": [sha("g\n"), sha("g\n")],
                empty: [sha(""), sha("")]
            });
        });
    });

    void it("also offers what git would store of a file checked out with CRLF line endings", () => {
        installed({ "demo/SKILL.md": "a\r\nb\r\n" }, root => {
            deepStrictEqual(readInstalled("demo", root), { "SKILL.md": [sha("a\r\nb\r\n"), sha("a\nb\n")] });
        });
    });

    void it("matches a link to nothing, and doesn't follow it", () => {
        installed({ "demo/SKILL.md": "a", "elsewhere/secret.md": "s" }, root => {
            symlinkSync(join(root, "elsewhere"), join(root, "demo", "linked"), "junction");

            deepStrictEqual(readInstalled("demo", root), { "SKILL.md": [sha("a"), sha("a")], linked: [] });
        });
    });

    void it("stops for a skill that isn't a folder of the install folder", () => {
        installed({ "demo/SKILL.md": "a", file: "f" }, root => {
            symlinkSync(join(root, "demo"), join(root, "alias"), "junction");

            for (const name of ["missing", "alias", "file", "..", ".", "", "a b", "demo/..", ".git"]) {
                throws(() => readInstalled(name, root), Stop);
            }
        });
    });
});

void describe("the command", () => {
    const script = fileURLToPath(new URL("./listSkillPins.ts", import.meta.url));

    void it("stops with exit code 3, the reason on stderr and nothing on stdout", () => {
        for (const [args, reason] of [
            [["--verify", "a b"], /a skill's name is/],
            [["--verify"], /usage:/],
            [["--verify", "a", "b"], /usage:/],
            [["--list"], /usage:/]
        ] as const) {
            const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

            deepStrictEqual([result.status, result.stdout], [3, ""]);
            match(result.stderr, reason);
        }
    });
});

void describe("tame", () => {
    void it("keeps what a command printed to plain text on one line, cut short", () => {
        strictEqual(tame("gh: Not Found (HTTP 404)\n"), "gh: Not Found (HTTP 404)");
        strictEqual(tame('a\u0060b\u0060 $(c) "d" \\e\r\n{f} | g'), "a b (c) d e f g");
        strictEqual(tame("x".repeat(1000)).length, 300);
    });
});
