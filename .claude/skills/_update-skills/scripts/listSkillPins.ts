// Lists what `_update-skills` may install: for each vendored skill the commit it is pinned to and
// the commit it may move to, and the `skills` CLI version to run. Nothing younger than 7 days is
// offered, the same cooldown `minimumReleaseAge` gives npm packages: a poisoned upstream change
// has a week to be noticed and reverted before this repo pulls it.
//
//   node .claude/skills/_update-skills/scripts/listSkillPins.ts
//
// stdout is JSON: { cli, skills: [{ skill, source, pinned, latest, settled }] }.
//
//   cli      the newest stable `skills` release published at least 7 days ago.
//   pinned   the `ref` of the skill's `skills-lock.json` entry.
//   settled  whether the skill's folder is the same on the source's default branch now as it was at
//            least 7 days ago. Both positions come from the pushes GitHub recorded and the time it
//            received each, never from a commit's own date, which its author sets. Also false while
//            no recorded push to the branch is 7 days old.
//   latest   the newest commit that changed the folder, null while `settled` is false. Its folder
//            is the one compared, so an install must name that folder, never the whole repo.
//
// Exit codes:
//   0  done
//   1  crashed: `skills-lock.json` or pnpm's answer couldn't be read
//   3  gh or pnpm failed, a source no longer looks the way this file records it, a skill doesn't
//      come from a GitHub folder, or no `skills` release that can pin a commit is 7 days old yet
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { posix } from "node:path";

interface LockEntry {
    source: string;
    sourceType: string;
    ref?: string;
    skillPath?: string;
}

interface SkillsLock {
    skills: Record<string, LockEntry>;
}

interface Branch {
    head: string;
    // Undefined while no recorded push to the branch is 7 days old.
    weekAgo: string | undefined;
}

// A push GitHub recorded: where it left the branch, and when GitHub received it.
export interface Push {
    after: string;
    at: number;
}

const MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const COMMIT_SHA = /^[0-9a-f]{40}$/;

const STABLE_VERSION = /^\d+\.\d+\.\d+$/;

// Before it, `owner/repo@<commit>` installs the default branch.
const MIN_CLI_VERSION = "1.8.0";

// A source that switches its default branch can present content that sat a week on a branch nobody
// watched, with no push to the new default on record. A change here is a human's to confirm.
const DEFAULT_BRANCHES: Record<string, string> = {
    "addyosmani/web-quality-skills": "main",
    "antfu/skills": "main",
    "github/awesome-copilot": "main",
    "vercel-labs/agent-browser": "main",
    "vercel/turborepo": "main",
    "workleap/wl-web-configs": "main"
};

// A stop this file decided on. It unwinds to the bottom of the file, which turns it into exit code
// 3 without `process.exit()`: called while a module is still evaluating, that one aborts on Windows
// instead of returning the code.
class Stop extends Error {}

function stop(message: string): never {
    throw new Stop(message);
}

function compareVersions(a: string, b: string) {
    const [left, right] = [a, b].map(version => version.split(".").map(Number));

    return (left?.[0] ?? 0) - (right?.[0] ?? 0) || (left?.[1] ?? 0) - (right?.[1] ?? 0) || (left?.[2] ?? 0) - (right?.[2] ?? 0);
}

export function pickCliVersion(publishedAt: Record<string, string>, now: Date) {
    const cutoff = now.getTime() - MIN_AGE_MS;

    return Object.entries(publishedAt)
        .filter(([version, published]) => STABLE_VERSION.test(version) && Date.parse(published) <= cutoff && compareVersions(version, MIN_CLI_VERSION) >= 0)
        .map(([version]) => version)
        .toSorted(compareVersions)
        .at(-1);
}

function readCliVersion() {
    const result = spawnSync("pnpm view skills time --json", { encoding: "utf8", shell: true });

    if (result.status !== 0) {
        return stop(`pnpm failed while listing the skills CLI releases: ${result.error?.message ?? result.stderr.trim()}`);
    }

    const publishedAt: Record<string, string> = JSON.parse(result.stdout);

    return pickCliVersion(publishedAt, new Date()) ?? stop(`no skills release from ${MIN_CLI_VERSION} up is 7 days old yet`);
}

function ghApi(path: string, fields: string[], jq: string, what: string, allPages = false) {
    try {
        return execFileSync("gh", ["api", "--method", "GET", ...(allPages ? ["--paginate"] : []), path, ...fields.flatMap(field => ["-f", field]), "--jq", jq], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
    } catch (error) {
        return stop(`gh failed while ${what}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// The pushes GitHub recorded for a branch, newest first: the last one alone, or every one of a period.
function listPushes(source: string, branch: string, period?: "month" | "year"): Push[] {
    const window = period ? [`time_period=${period}`, "per_page=100"] : ["per_page=1"];
    const lines = ghApi(`repos/${source}/activity`, [`ref=refs/heads/${branch}`, "direction=desc", ...window], ".[] | [.after, .timestamp] | tojson", `reading the pushes to ${source}`, period !== undefined);

    return lines
        .split("\n")
        .filter(Boolean)
        .map(line => {
            const [after, timestamp]: unknown[] = JSON.parse(line);

            return { after: typeof after === "string" ? after : "", at: typeof timestamp === "string" ? Date.parse(timestamp) : Number.NaN };
        });
}

/**
 * Where a branch was at least 7 days ago, read from its recorded pushes, newest first: where the
 * newest push that old left it. Undefined when no listed push is that old.
 *
 * It is the end of an old push, never the start of the first recent one: GitHub now and then fails
 * to record a push, and the first recent push then starts from what the unrecorded one brought in,
 * however young that is.
 */
export function readWeekAgo(pushes: Push[], now: Date) {
    const cutoff = now.getTime() - MIN_AGE_MS;

    return pushes.find(push => push.at <= cutoff)?.after;
}

function readBranch(source: string): Branch {
    const name = ghApi(`repos/${source}`, [], ".default_branch", `resolving the default branch of ${source}`);

    if (!Object.hasOwn(DEFAULT_BRANCHES, source)) {
        return stop(`${source} isn't in DEFAULT_BRANCHES — record its default branch ("${name}") there once you've confirmed it is the branch its skills should follow`);
    }

    if (name !== DEFAULT_BRANCHES[source]) {
        return stop(`${source}'s default branch is "${name}" and DEFAULT_BRANCHES records "${DEFAULT_BRANCHES[source]}" — find out why before recording the new one`);
    }

    // The head is the last recorded push, not the branch ref: the record trails the ref by a second
    // or so, and once in a while never gets a push at all. Read from the record alone, the head and
    // the position 7 days ago can't disagree, and an unrecorded last push is merely not seen yet.
    const [last] = listPushes(source, name);

    if (!last || !COMMIT_SHA.test(last.after)) {
        return stop(`${source}: GitHub's push history has no usable last push for ${name} ("${last?.after ?? ""}"), so the branch's last week can't be read`);
    }

    // A source with no push this week is settled by its last push alone. Otherwise the month holds a
    // push old enough, or failing that the year.
    const now = new Date();
    const weekAgo = readWeekAgo([last], now) ?? readWeekAgo(listPushes(source, name, "month"), now) ?? readWeekAgo(listPushes(source, name, "year"), now);

    return { head: last.after, weekAgo };
}

function folderTree(source: string, commit: string, folder: string) {
    return ghApi(`repos/${source}/git/trees/${commit}:${folder}`, [], ".sha", `reading ${folder} of ${source} at ${commit}`);
}

function folderTreeWeekAgo(source: string, commit: string | undefined, folder: string) {
    if (!commit || !COMMIT_SHA.test(commit)) {
        return undefined;
    }

    const result = spawnSync("gh", ["api", `repos/${source}/git/trees/${commit}:${folder}`, "--jq", ".sha"], { encoding: "utf8" });

    if (result.status === 0) {
        return result.stdout.trim();
    }

    if (result.stderr.includes("HTTP 404")) {
        return undefined;
    }

    return stop(`gh failed reading ${folder} of ${source} at ${commit}: ${result.error?.message ?? result.stderr.trim()}`);
}

function latestCommit(source: string, branch: Branch, folder: string, tree: string) {
    const sha = ghApi(`repos/${source}/commits`, [`sha=${branch.head}`, `path=${folder}`, "per_page=1"], ".[0].sha", `resolving the latest commit of ${source}/${folder}`);

    if (!COMMIT_SHA.test(sha)) {
        return stop(`gh answered "${sha}" for the latest commit of ${source}/${folder}`);
    }

    return folderTree(source, sha, folder) === tree ? sha : stop(`${source}/${folder} at its latest commit ${sha} isn't the folder the branch head holds`);
}

function listSkillPins() {
    const cli = readCliVersion();
    const lock: SkillsLock = JSON.parse(readFileSync("skills-lock.json", "utf8"));
    const branches = new Map<string, Branch>();

    const skills = Object.entries(lock.skills).map(([skill, entry]) => {
        // The cooldown is measured on a folder's commit history: a source without one has to be
        // given its own rule here before it can be installed.
        if (entry.sourceType !== "github" || !entry.skillPath) {
            return stop(`${skill} isn't recorded in skills-lock.json as a folder of a GitHub repository (sourceType "${entry.sourceType}", skillPath ${JSON.stringify(entry.skillPath)}), so it has no cooldown`);
        }

        const branch = branches.get(entry.source) ?? readBranch(entry.source);
        branches.set(entry.source, branch);

        const folder = posix.dirname(entry.skillPath);
        const tree = folderTree(entry.source, branch.head, folder);
        const settled = tree === folderTreeWeekAgo(entry.source, branch.weekAgo, folder);

        return { skill, source: entry.source, pinned: entry.ref ?? null, latest: settled ? latestCommit(entry.source, branch, folder, tree) : null, settled };
    });

    return { cli, skills };
}

if (import.meta.main) {
    try {
        console.log(JSON.stringify(listSkillPins(), null, 4));
    } catch (error) {
        if (!(error instanceof Stop)) {
            throw error;
        }

        console.error(error.message);
        process.exitCode = 3;
    }
}
