// node --test .github/scripts/listUpdateDependenciesPrs.test.ts
import { deepStrictEqual, strictEqual, throws } from "node:assert/strict";
import { describe, it } from "node:test";
import { carriesDependencies, parsePullRequests, selectOwn, type PullRequest } from "./listUpdateDependenciesPrs.ts";

const OWN: PullRequest = { number: 306, author: "app/claude", headRefName: "agent/update-deps-20261124-140958", isCrossRepository: false };

void describe("selectOwn", () => {
    void it("keeps a pull request the workflow opened from a branch of this repository", () => {
        deepStrictEqual(selectOwn([OWN]), [OWN]);
    });

    void it("leaves out a fork's pull request, whatever its author and branch are named", () => {
        deepStrictEqual(selectOwn([{ ...OWN, number: 400, isCrossRepository: true }]), []);
    });

    void it("leaves out another author's pull request on a matching branch", () => {
        deepStrictEqual(selectOwn([{ ...OWN, number: 401, author: "someone" }]), []);
    });

    void it("leaves out the workflow identity's pull request on another branch", () => {
        deepStrictEqual(selectOwn([{ ...OWN, number: 402, headRefName: "claude/issue-12" }]), []);
    });
});

void describe("parsePullRequests", () => {
    void it("reads the fields selection rests on and nothing else", () => {
        const output = JSON.stringify([{ number: 306, title: "chore: update dependencies 2026-11-24", author: { login: "app/claude", is_bot: true }, headRefName: OWN.headRefName, isCrossRepository: false }]);

        deepStrictEqual(parsePullRequests(output), [OWN]);
    });

    void it("throws when a field is missing, so a pull request is never selected on a default", () => {
        throws(() => parsePullRequests(JSON.stringify([{ number: 306, author: { login: "app/claude" }, headRefName: OWN.headRefName }])));
    });

    void it("throws when gh answers something else than a list", () => {
        throws(() => parsePullRequests(JSON.stringify({ message: "Not Found" })));
    });
});

void describe("carriesDependencies", () => {
    void it("is true when a package.json changed, at the root or below", () => {
        strictEqual(carriesDependencies(["pnpm-lock.yaml", "package.json"]), true);
        strictEqual(carriesDependencies([".changeset/update-deps.md", "packages/telemetry/package.json"]), true);
    });

    void it("is false for a skills-only change", () => {
        strictEqual(carriesDependencies([".claude/skills/agent-browser/SKILL.md", "skills-lock.json"]), false);
    });

    void it("is false for a file that only ends like one", () => {
        strictEqual(carriesDependencies(["docs/not-a-package.json"]), false);
    });
});
