// node --test .claude/skills/_update-skills/scripts/listSkillPins.test.ts
import { strictEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { pickCliVersion } from "./listSkillPins.ts";

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
