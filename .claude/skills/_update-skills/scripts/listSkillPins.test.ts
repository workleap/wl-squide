// node --test .claude/skills/_update-skills/scripts/listSkillPins.test.ts
import { deepStrictEqual, strictEqual, throws } from "node:assert/strict";
import { describe, it } from "node:test";
import { isUnchanged, listSkills, parseLookup, pickCliVersion, pickUsableCliVersion, readPositions, servedReleases, type GitHub, type LockEntry, type Push, type SkillsLock } from "./listSkillPins.ts";

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

    void it("never picks a release the registry no longer serves", () => {
        // "1.8.1" was unpublished: the registry still tells when it was published.
        const publishedAt = servedReleases({ created: "2026-01-01T00:00:00.000Z", "1.8.0": "2026-11-01T00:00:00.000Z", "1.8.1": "2026-11-02T00:00:00.000Z" }, ["1.8.0"]);

        deepStrictEqual(publishedAt, { "1.8.0": "2026-11-01T00:00:00.000Z" });
        strictEqual(pickCliVersion(publishedAt, NOW), "1.8.0");
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
        const last = push("c", "d", "2026-11-19T00:00:00.000Z");

        deepStrictEqual(readPositions([last, push("b", "c", "not a date"), push("a", "b", "2026-11-10T00:00:00.000Z")], NOW, last), ["b", "c", "d"]);
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

void describe("parseLookup", () => {
    void it("reads each position's line, in whatever order they come", () => {
        deepStrictEqual(parseLookup(`p1 ${OTHER}\np0 ${TREE}\n`, 2), [TREE, OTHER]);
        deepStrictEqual(parseLookup(`p0 ${TREE}\r\np1 ${OTHER}\r\n`, 2), [TREE, OTHER]);
    });

    void it("answers null for a position with no line or no oid", () => {
        deepStrictEqual(parseLookup(`p0 ${TREE}\np1 \n`, 3), [TREE, null, null]);
        deepStrictEqual(parseLookup("", 2), [null, null]);
        deepStrictEqual(parseLookup(`p0${TREE}\nnonsense\n`, 1), [null]);
    });
});

void describe("pickUsableCliVersion", () => {
    const publishedAt = { "1.8.0": "2026-11-01T00:00:00.000Z", "1.8.1": "2026-11-02T00:00:00.000Z", "1.8.2": "2026-11-03T00:00:00.000Z" };
    const served = Object.keys(publishedAt);

    void it("skips a deprecated release for the one before it", () => {
        strictEqual(
            pickUsableCliVersion(publishedAt, served, NOW, version => version !== "1.8.0"),
            "1.8.0"
        );
    });

    void it("skips a release the registry no longer serves without asking about it", () => {
        const asked: string[] = [];

        strictEqual(
            pickUsableCliVersion(publishedAt, ["1.8.0", "1.8.1"], NOW, version => {
                asked.push(version);

                return false;
            }),
            "1.8.1"
        );
        deepStrictEqual(asked, ["1.8.1"]);
    });

    void it("offers nothing when every release old enough is deprecated", () => {
        strictEqual(
            pickUsableCliVersion(publishedAt, served, NOW, () => true),
            undefined
        );
    });
});

const DAY = 24 * 60 * 60 * 1000;
const SOURCE = "upstream/skills";
const BRANCHES = { [SOURCE]: "main" };
const PINNED = position(900);
const DEMO: LockEntry = { source: SOURCE, sourceType: "github", ref: PINNED, skillPath: "skills/demo/SKILL.md" };
const LOCK: SkillsLock = { skills: { demo: DEMO } };
// Commits of the upstream branch, oldest first.
const [P, X, Q, R, Y, Z] = [position(1), position(2), position(3), position(4), position(5), position(6)] as const;

function pushed(before: string, after: string, daysAgo: number): Push {
    return { before, after, at: NOW.getTime() - daysAgo * DAY };
}

function missing(what: string): never {
    throw new Error(what);
}

interface Upstream {
    branch?: string;
    // The tree of the skill's folder at each commit that has one.
    folder: Record<string, string>;
    // The pushes GitHub recorded, newest first.
    pushes: Push[];
    // Where the branch points, when it isn't where the last recorded push left it.
    ref?: string;
    // What GitHub answers as the newest commit that changed the folder.
    latest: string;
}

// GitHub answering from memory, recording what it was asked in `asked`.
function upstream({ branch = "main", folder, pushes, ref, latest }: Upstream, asked: string[] = []): GitHub {
    return {
        defaultBranch: () => {
            asked.push("branch");

            return branch;
        },
        pushes: (_source, _branch, period) => {
            asked.push(`pushes of the ${period ?? "last push"}`);

            return period ? pushes.filter(recorded => recorded.at > NOW.getTime() - (period === "month" ? 30 : 365) * DAY) : pushes.slice(0, 1);
        },
        ref: () => ref ?? pushes[0]?.after ?? "",
        folderTree: (_source, commit) => folder[commit] ?? missing(`no folder at ${commit}`),
        folderTrees: (_source, commits) => {
            asked.push(`${commits.length} lookups`);

            return commits.map(commit => folder[commit] ?? null);
        },
        latestCommit: () => latest
    };
}

const settledAt = (latest: string) => [{ skill: "demo", source: SOURCE, pinned: PINNED, latest, settled: true }];
const WAITING = [{ skill: "demo", source: SOURCE, pinned: PINNED, latest: null, settled: false }];
// The folder was set by X, pushed 8 days ago.
const OLD_PUSHES = [pushed(P, X, 8), pushed("0".repeat(40), P, 40)];

void describe("listSkills", () => {
    void it("settles a folder on a branch nobody pushed to this week, from its last push alone", () => {
        const asked: string[] = [];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE }, pushes: OLD_PUSHES, latest: X }, asked), NOW, BRANCHES), settledAt(X));
        deepStrictEqual(asked, ["branch", "pushes of the last push"]);
    });

    void it("settles a folder that this week's pushes left alone", () => {
        const pushes = [pushed(Q, R, 1), pushed(X, Q, 3), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE, [R]: TREE }, pushes, latest: X }), NOW, BRANCHES), settledAt(X));
    });

    void it("waits after a change inside the 7 days", () => {
        const pushes = [pushed(Q, R, 3), pushed(X, Q, 5), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE, [R]: OTHER }, pushes, latest: R }), NOW, BRANCHES), WAITING);
    });

    void it("waits when the folder was changed and restored inside the 7 days", () => {
        // X and Z hold the same folder, Y another: now and 7 days ago look the same.
        const pushes = [pushed(Y, Z, 0.01), pushed(X, Y, 5), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Y]: OTHER, [Z]: TREE }, pushes, latest: Z }), NOW, BRANCHES), WAITING);
    });

    void it("waits when it was changed by a push GitHub never recorded", () => {
        const pushes = [pushed(Y, Z, 0.01), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Y]: OTHER, [Z]: TREE }, pushes, latest: Z }), NOW, BRANCHES), WAITING);
    });

    void it("waits when the branch has moved on from its last recorded push, and the folder with it", () => {
        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Y]: OTHER }, pushes: OLD_PUSHES, ref: Y, latest: X }), NOW, BRANCHES), WAITING);
    });

    void it("settles when the branch has moved on but the folder hasn't", () => {
        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes: OLD_PUSHES, ref: Q, latest: X }), NOW, BRANCHES), settledAt(X));
    });

    void it("waits when a position of the week no longer exists", () => {
        const pushes = [pushed(Y, Q, 1), ...OLD_PUSHES];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, latest: X }), NOW, BRANCHES), WAITING);
    });

    void it("looks in the year when the month holds no push old enough", () => {
        const asked: string[] = [];
        const pushes = [pushed(X, Q, 2), pushed(P, X, 60)];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, latest: X }, asked), NOW, BRANCHES), settledAt(X));
        deepStrictEqual(asked, ["branch", "pushes of the last push", "pushes of the month", "pushes of the year", "1 lookups"]);
    });

    void it("waits on a branch whose record doesn't reach back 7 days", () => {
        const pushes = [pushed(X, Q, 1), pushed("0".repeat(40), X, 2)];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: { [X]: TREE, [Q]: TREE }, pushes, latest: X }), NOW, BRANCHES), WAITING);
    });

    void it("sees a change past the first hundred positions of a busy week", () => {
        const commits = Array.from({ length: 150 }, (_unused, index) => position(1000 + index));
        const pushes = [...commits.map((commit, index) => pushed(commits[index - 1] ?? X, commit, (150 - index) / 1000)).toReversed(), ...OLD_PUSHES];
        const unchanged = Object.fromEntries([X, ...commits].map(commit => [commit, TREE]));
        const asked: string[] = [];

        deepStrictEqual(listSkills(LOCK, upstream({ folder: unchanged, pushes, latest: X }, asked), NOW, BRANCHES), settledAt(X));
        deepStrictEqual(asked.slice(-2), ["100 lookups", "50 lookups"]);
        deepStrictEqual(listSkills(LOCK, upstream({ folder: { ...unchanged, [position(1120)]: OTHER }, pushes, latest: X }), NOW, BRANCHES), WAITING);
    });

    void it("reads a source once for all its skills", () => {
        const asked: string[] = [];
        const lock: SkillsLock = { skills: { demo: DEMO, other: { source: SOURCE, sourceType: "github", skillPath: "skills/other/SKILL.md" } } };
        const listing = listSkills(lock, upstream({ folder: { [X]: TREE }, pushes: OLD_PUSHES, latest: X }, asked), NOW, BRANCHES);

        deepStrictEqual(
            listing.map(skill => [skill.skill, skill.pinned, skill.settled]),
            [
                ["demo", PINNED, true],
                ["other", null, true]
            ]
        );
        deepStrictEqual(asked, ["branch", "pushes of the last push"]);
    });

    void it("stops when a source isn't what this file records", () => {
        const fine = { folder: { [X]: TREE }, pushes: OLD_PUSHES, latest: X };

        deepStrictEqual(listSkills(LOCK, upstream(fine), NOW, BRANCHES), settledAt(X));
        // Its default branch changed.
        throws(() => listSkills(LOCK, upstream({ ...fine, branch: "next" }), NOW, BRANCHES));
        // Nobody recorded its default branch.
        throws(() => listSkills(LOCK, upstream(fine), NOW, {}));
        // GitHub has no push on record for it, or one that doesn't end at a commit.
        throws(() => listSkills(LOCK, upstream({ ...fine, folder: { [X]: TREE, "": TREE }, pushes: [] }), NOW, BRANCHES));
        throws(() => listSkills(LOCK, upstream({ ...fine, folder: { [X]: TREE, main: TREE }, pushes: [pushed(P, "main", 8)] }), NOW, BRANCHES));
        // The skill's folder is gone from the head.
        throws(() => listSkills(LOCK, upstream({ ...fine, folder: {} }), NOW, BRANCHES));
        // The commit GitHub answers as the latest doesn't hold the head's folder, or isn't a commit.
        throws(() => listSkills(LOCK, upstream({ ...fine, folder: { [X]: TREE, [P]: OTHER }, latest: P }), NOW, BRANCHES));
        throws(() => listSkills(LOCK, upstream({ ...fine, folder: { [X]: TREE, main: TREE }, latest: "main" }), NOW, BRANCHES));
    });
});
