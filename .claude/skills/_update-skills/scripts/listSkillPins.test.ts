// node --test .claude/skills/_update-skills/scripts/listSkillPins.test.ts
import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { isUnchanged, parseLookup, pickCliVersion, readPositions, type Push } from "./listSkillPins.ts";

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
